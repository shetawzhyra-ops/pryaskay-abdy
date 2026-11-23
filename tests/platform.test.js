const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { isAllowedUpload } = require('../middleware/uploads');
const { normalizeKurdishArabic } = require('../lib/search');
const { createBackupManager } = require('../lib/backup');
const { validateRegistrationPayload } = require('../lib/registration');
const { addComment, getComments, deleteComment } = require('../lib/comments');
const { db, dbPath } = require('../db');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('Upload filter allows valid media/docs and blocks XSS/executable files', () => {
  assert.equal(isAllowedUpload('photo.jpg', 'image/jpeg').allowed, true);
  assert.equal(isAllowedUpload('avatar.webp', 'image/webp').allowed, true);
  assert.equal(isAllowedUpload('voice.webm', 'audio/webm').allowed, true);
  assert.equal(isAllowedUpload('lesson.mp3', 'audio/mpeg').allowed, true);
  assert.equal(isAllowedUpload('clip.mp4', 'video/mp4').allowed, true);
  assert.equal(isAllowedUpload('book.pdf', 'application/pdf').allowed, true);

  // Blocked security risks
  assert.equal(isAllowedUpload('xss.html', 'text/html').allowed, false);
  assert.equal(isAllowedUpload('evil.svg', 'image/svg+xml').allowed, false);
  assert.equal(isAllowedUpload('script.js', 'application/javascript').allowed, false);
  assert.equal(isAllowedUpload('shell.php', 'application/x-httpd-php').allowed, false);
  assert.equal(isAllowedUpload('malware.exe', 'application/x-msdownload').allowed, false);
  assert.equal(isAllowedUpload('blob', 'text/html').allowed, false);
});

test('Kurdish/Arabic search normalizer unifies common keyboard variants', () => {
  assert.equal(normalizeKurdishArabic('پرياسكه'), normalizeKurdishArabic('پریاسکە'));
  assert.equal(normalizeKurdishArabic('كتاب'), normalizeKurdishArabic('کتاب'));
  assert.equal(normalizeKurdishArabic('إسلام'), normalizeKurdishArabic('اسلام'));
});

test('Backup manager snapshots live data.db safely using SQLite VACUUM INTO', () => {
  const tmpBackupsDir = path.join(__dirname, '..', 'backups', '_test_verify');
  const manager = createBackupManager({ db, dbPath, backupsDir: tmpBackupsDir });
  assert.ok(manager.getLiveDbPath().endsWith('data.db'), 'Live DB must resolve to data.db');

  const snap = manager.createBackupSnapshot(false);
  assert.ok(snap, 'Snapshot should be created');
  assert.ok(snap.size > 4096, 'Snapshot should have valid SQLite size');

  const snapPath = path.join(tmpBackupsDir, snap.filename);
  const header = fs.readFileSync(snapPath).subarray(0, 15).toString('utf8');
  assert.equal(header, 'SQLite format 3', 'Backup file must be a valid SQLite database');

  // Cleanup test backup directory
  fs.rmSync(tmpBackupsDir, { recursive: true, force: true });
});

test('GET /api/health reports healthy DB in WAL mode', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.status, 'healthy');
  assert.equal(data.db.connected, true);
  assert.equal(String(data.db.journalMode).toLowerCase(), 'wal');
  assert.ok(data.db.sizeKB > 0);
});

test('GET /api/search runs SQLite FTS5 Kurdish search and isolates private items for guests', async () => {
  const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent('پریاسکە')}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.ftsEnabled, true);
  assert.equal(data.includePrivate, false);
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length > 0, 'Expected at least 1 match for پریاسکە');
  for (const item of data.results) {
    assert.notEqual(item.type, 'book', 'Guests must not receive private books');
    assert.notEqual(item.type, 'lesson', 'Guests must not receive private lessons');
  }
});

test('SEO routes /robots.txt and /sitemap.xml return valid content', async () => {
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  assert.equal(robotsRes.status, 200);
  const robotsTxt = await robotsRes.text();
  assert.ok(robotsTxt.includes('Sitemap:'));
  assert.ok(robotsTxt.includes('Allow: /dreams'));

  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  assert.equal(sitemapRes.status, 200);
  const xml = await sitemapRes.text();
  assert.ok(xml.includes('<urlset'));
  assert.ok(xml.includes('/dreams'));
  assert.ok(xml.includes('/articles'));
  assert.ok(xml.includes('/poems'));
});

test('Public pages have Open Graph SEO, compiled Tailwind CSS, Global Search, and strict CSP', async () => {
  for (const route of ['/', '/dreams', '/articles', '/poems']) {
    const res = await fetch(`${BASE_URL}${route}`);
    assert.equal(res.status, 200, `${route} should return 200`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('x-powered-by'), null);

    const csp = res.headers.get('content-security-policy') || '';
    assert.ok(csp.length > 20, 'CSP header must exist');
    assert.ok(!csp.includes('cdn.tailwindcss.com'), 'CSP should not allow cdn.tailwindcss.com');
    assert.ok(!csp.includes('unsafe-eval'), 'CSP should not allow unsafe-eval');

    const html = await res.text();
    assert.ok(html.includes('property="og:title"'), `${route} missing og:title`);
    assert.ok(html.includes('/css/tailwind.built.css'), `${route} missing compiled Tailwind CSS`);
    assert.ok(html.includes('/js/global-search.js'), `${route} missing global-search.js`);
    assert.ok(!html.includes('cdn.tailwindcss.com'), `${route} still references Tailwind Play CDN`);
  }
});

test('Auth routes expose standard rate-limiting headers', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
  const rlHeader = res.headers.get('ratelimit') || res.headers.get('ratelimit-limit');
  assert.ok(rlHeader, 'RateLimit header should be present on /api/auth/login');
});

test('PWA Service Worker, Offline Folio, and optimized assets serve HTTP 200', async () => {
  const swRes = await fetch(`${BASE_URL}/sw.js`);
  assert.equal(swRes.status, 200);
  const swText = await swRes.text();
  assert.ok(swText.includes("addEventListener('push'"), 'sw.js must handle push events');
  assert.ok(swText.includes("addEventListener('notificationclick'"), 'sw.js must handle notificationclick');
  assert.ok(swText.includes('/offline.html'), 'sw.js must reference /offline.html');

  for (const asset of ['/offline.html', '/css/tailwind.built.css', '/js/global-search.js', '/images/logo.webp', '/images/pryaska_icon.webp']) {
    const r = await fetch(`${BASE_URL}${asset}`);
    assert.equal(r.status, 200, `${asset} must return 200`);
  }
});

test('Registration validator strictly enforces phone, languages, profession, residence, certificate', () => {
  const baseValid = {
    full_name: 'ئەحمەد محەمەد عەلی',
    gender: 'male',
    phone: '٠٧٥٠١٢٣٤٥٦٧',
    languages: '٢ زمان (کوردی، عەرەبی)',
    profession: 'قوتابی',
    residence: 'هەولێر',
    certificate: 'بەکالۆریۆس',
    username: 'ahmad_test',
    password: 'password123'
  };

  const ok = validateRegistrationPayload(baseValid);
  assert.equal(ok.valid, true);
  assert.equal(ok.data.phone, '07501234567');

  for (const key of ['phone', 'languages', 'profession', 'residence', 'certificate']) {
    const missing = { ...baseValid, [key]: '' };
    const r = validateRegistrationPayload(missing);
    assert.equal(r.valid, false, `Missing ${key} must fail`);
    assert.equal(r.field, key);
  }

  assert.equal(validateRegistrationPayload({ ...baseValid, phone: 'abcdef' }).valid, false);
  assert.equal(validateRegistrationPayload({ ...baseValid, phone: '123' }).valid, false);
  assert.equal(validateRegistrationPayload({ ...baseValid, phone: '00000000' }).valid, false);
  assert.equal(validateRegistrationPayload({ ...baseValid, profession: '1234' }).valid, false);
  assert.equal(validateRegistrationPayload({ ...baseValid, residence: '...' }).valid, false);
  assert.equal(validateRegistrationPayload({ ...baseValid, certificate: '!' }).valid, false);
});

test('POST /api/auth/register rejects incomplete or invalid mandatory applicant fields with HTTP 400', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'ئازاد عەلی حسن',
      gender: 'male',
      username: 'incomplete_user_test',
      password: 'secret123',
      phone: '123',
      languages: '',
      profession: '',
      residence: '',
      certificate: ''
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error && data.error.length > 0);
});

test('Public comments work for poems, articles, and dreams without polluting DB after cleanup', async () => {
  // 1. Validate /api/comments/counts HTTP 200 across all 3 sections
  for (const type of ['poem', 'article', 'dream']) {
    const res = await fetch(`${BASE_URL}/api/comments/counts?type=${type}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.type, type);
    assert.equal(typeof data.counts, 'object');
  }

  // 2. Test full lifecycle (create -> read -> client_id privacy -> delete) on a real existing poem/article/dream if present
  const poem = db.prepare('SELECT id FROM poems LIMIT 1').get();
  if (poem) {
    const testClientId = 'test_comment_client_' + Date.now();
    const created = addComment(db, {
      type: 'poem',
      id: poem.id,
      authorName: 'میوانی تاقیکردنەوە',
      content: 'دەستتان خۆش بێت، زۆر جوان بوو',
      clientId: testClientId
    });
    assert.equal(created.valid, true);
    assert.equal(created.status, 201);

    const listRes = await fetch(`${BASE_URL}/api/comments/poem/${poem.id}`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.success, true);
    const found = listData.comments.find((c) => c.id === created.comment.id);
    assert.ok(found, 'Created comment should appear in public GET');
    assert.equal(found.client_id, undefined, 'client_id must never leak in public response');
    assert.equal(found.can_delete, false, 'Other visitors cannot delete someone else comment');

    // Clean up test comment via owner client_id
    const delRes = await fetch(`${BASE_URL}/api/comments/${created.comment.id}`, {
      method: 'DELETE',
      headers: { 'x-client-id': testClientId }
    });
    assert.equal(delRes.status, 200);
  }
});

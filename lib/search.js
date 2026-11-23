/**
 * Full-Text Global Search Engine (SQLite FTS5 + Kurdish/Arabic Normalization)
 * Searches dreams, approved articles, poems, announcements (public),
 * plus library books & recorded lessons (authenticated users).
 */

function normalizeKurdishArabic(input) {
  if (!input) return '';
  return String(input)
    // Remove Arabic diacritics and tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Yeh / Kaf / Alef / Heh variants common in Sorani & Arabic keyboards
    .replace(/[يئى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ةۀهھ]/g, 'ە')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function makeSnippet(text, query, maxLen = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  const normClean = normalizeKurdishArabic(clean);
  const normQuery = normalizeKurdishArabic(query);
  const firstWord = normQuery.split(' ')[0];
  const idx = firstWord ? normClean.indexOf(firstWord) : -1;
  if (idx > 35) {
    const start = Math.max(0, idx - 35);
    return '...' + clean.slice(start, start + maxLen).trim() + '...';
  }
  return clean.slice(0, maxLen).trim() + '...';
}

function createSearchEngine(db) {
  let ftsEnabled = false;

  function initSearchIndex() {
    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS global_search_fts USING fts5(
          entity_type UNINDEXED,
          entity_id UNINDEXED,
          is_public UNINDEXED,
          title,
          body,
          author,
          norm_text,
          created_at UNINDEXED,
          tokenize='unicode61 remove_diacritics 2'
        );
      `);
      ftsEnabled = true;
      rebuildSearchIndex();
    } catch (err) {
      ftsEnabled = false;
      console.warn('FTS5 init note (using LIKE fallback):', err.message);
    }
    return ftsEnabled;
  }

  function rebuildSearchIndex() {
    if (!ftsEnabled) return false;
    try {
      db.exec('BEGIN IMMEDIATE');
      db.exec('DELETE FROM global_search_fts');

      const insert = db.prepare(`
        INSERT INTO global_search_fts (entity_type, entity_id, is_public, title, body, author, norm_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. Published Dream Posts (Public)
      try {
        const dreams = db.prepare('SELECT id, title, dream_text, interpretation, author_name, created_at FROM dream_posts').all();
        for (const d of dreams) {
          const body = `${d.dream_text || ''} ${d.interpretation || ''}`.trim();
          const norm = normalizeKurdishArabic(`${d.title || ''} ${body} ${d.author_name || ''}`);
          insert.run('dream', String(d.id), '1', d.title || '', body, d.author_name || 'دەستەی لێکدانەوەی خەون', norm, String(d.created_at || 0));
        }
      } catch (e) {}

      // 2. Approved Articles (Public)
      try {
        const articles = db.prepare("SELECT id, title, content, author_name, created_at FROM articles WHERE status = 'approved'").all();
        for (const a of articles) {
          const norm = normalizeKurdishArabic(`${a.title || ''} ${a.content || ''} ${a.author_name || ''}`);
          insert.run('article', String(a.id), '1', a.title || '', a.content || '', a.author_name || '', norm, String(a.created_at || 0));
        }
      } catch (e) {}

      // 3. Poems (Public)
      try {
        const poems = db.prepare('SELECT id, title, content, author, created_at FROM poems').all();
        for (const p of poems) {
          const norm = normalizeKurdishArabic(`${p.title || ''} ${p.content || ''} ${p.author || ''}`);
          insert.run('poem', String(p.id), '1', p.title || '', p.content || '', p.author || 'م. ئازاد', norm, String(p.created_at || 0));
        }
      } catch (e) {}

      // 4. Announcements (Public)
      try {
        const anns = db.prepare('SELECT id, title, content, author, created_at FROM announcements').all();
        for (const n of anns) {
          const norm = normalizeKurdishArabic(`${n.title || ''} ${n.content || ''} ${n.author || ''}`);
          insert.run('announcement', String(n.id), '1', n.title || '', n.content || '', n.author || 'پریاسکەی عەبدی', norm, String(n.created_at || 0));
        }
      } catch (e) {}

      // 5. Library Books (Authenticated Members Only)
      try {
        const books = db.prepare('SELECT id, title, author, description, category, created_at FROM library_books').all();
        for (const b of books) {
          const body = `${b.category || ''} ${b.description || ''}`.trim();
          const norm = normalizeKurdishArabic(`${b.title || ''} ${b.author || ''} ${body}`);
          insert.run('book', String(b.id), '0', b.title || '', body, b.author || '', norm, String(b.created_at || 0));
        }
      } catch (e) {}

      // 6. Recorded Lessons (Authenticated Members Only)
      try {
        const lessons = db.prepare('SELECT id, title, description, teacher_name, folder_name, created_at FROM recorded_lessons').all();
        for (const l of lessons) {
          const body = `${l.folder_name || ''} ${l.description || ''}`.trim();
          const norm = normalizeKurdishArabic(`${l.title || ''} ${l.teacher_name || ''} ${body}`);
          insert.run('lesson', String(l.id), '0', l.title || '', body, l.teacher_name || '', norm, String(l.created_at || 0));
        }
      } catch (e) {}

      db.exec('COMMIT');
      return true;
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch (e) {}
      console.error('Search index rebuild error:', err.message);
      return false;
    }
  }

  function mapResultUrl(type, id) {
    switch (type) {
      case 'dream': return `/dreams?id=${id}`;
      case 'article': return `/articles?id=${id}`;
      case 'poem': return `/poems?id=${id}`;
      case 'announcement': return `/#announcements`;
      case 'book': return `/?openModal=library&id=${id}`;
      case 'lesson': return `/?openModal=recordedLessons&id=${id}`;
      default: return '/';
    }
  }

  function mapTypeLabel(type) {
    switch (type) {
      case 'dream': return 'خەونی لێکدراوە';
      case 'article': return 'وتار';
      case 'poem': return 'شیعر';
      case 'announcement': return 'ئاگاداری';
      case 'book': return 'کتێبخانە';
      case 'lesson': return 'وانەی تۆمارکراو';
      default: return 'گشتی';
    }
  }

  function searchAll({ query, includePrivate = false, type = 'all', limit = 20 }) {
    const rawQuery = String(query || '').trim();
    const normQuery = normalizeKurdishArabic(rawQuery);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    if (!normQuery || normQuery.length < 1) {
      return { results: [], ftsEnabled, query: rawQuery };
    }

    const allowedTypes = new Set(['dream', 'article', 'poem', 'announcement', 'book', 'lesson']);
    const typeFilter = type && type !== 'all' && allowedTypes.has(type) ? type : null;

    if (ftsEnabled) {
      try {
        const tokens = normQuery
          .replace(/["'()*^:]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 6);

        if (tokens.length > 0) {
          const matchExpr = tokens.map((t) => `"${t}"*`).join(' AND ');
          const whereParts = ['global_search_fts MATCH ?'];
          const params = [matchExpr];

          if (!includePrivate) {
            whereParts.push("is_public = '1'");
          }
          if (typeFilter) {
            whereParts.push('entity_type = ?');
            params.push(typeFilter);
          }

          const sql = `
            SELECT entity_type, entity_id, title, body, author, created_at, bm25(global_search_fts) AS rank
            FROM global_search_fts
            WHERE ${whereParts.join(' AND ')}
            ORDER BY rank ASC, CAST(created_at AS INTEGER) DESC
            LIMIT ?
          `;
          params.push(safeLimit);

          const rows = db.prepare(sql).all(...params);
          if (rows.length > 0) {
            return {
              ftsEnabled: true,
              query: rawQuery,
              results: rows.map((r) => ({
                type: r.entity_type,
                typeLabel: mapTypeLabel(r.entity_type),
                id: Number(r.entity_id),
                title: r.title,
                snippet: makeSnippet(r.body, rawQuery),
                author: r.author,
                createdAt: Number(r.created_at) || 0,
                url: mapResultUrl(r.entity_type, r.entity_id)
              }))
            };
          }
        }
      } catch (err) {
        // Fall through cleanly to LIKE substring search (handles partial middle-word matches)
      }
    }

    // Substring fallback (also catches mid-word Kurdish suffixes!)
    const likePattern = `%${normQuery}%`;
    const results = [];
    const pushItem = (entityType, row, title, body, author) => {
      if (typeFilter && typeFilter !== entityType) return;
      const haystack = normalizeKurdishArabic(`${title || ''} ${body || ''} ${author || ''}`);
      if (haystack.includes(normQuery)) {
        results.push({
          type: entityType,
          typeLabel: mapTypeLabel(entityType),
          id: Number(row.id),
          title: title || '',
          snippet: makeSnippet(body, rawQuery),
          author: author || '',
          createdAt: Number(row.created_at) || 0,
          url: mapResultUrl(entityType, row.id)
        });
      }
    };

    try {
      for (const d of db.prepare('SELECT id, title, dream_text, interpretation, author_name, created_at FROM dream_posts ORDER BY created_at DESC LIMIT 200').all()) {
        pushItem('dream', d, d.title, `${d.dream_text || ''} ${d.interpretation || ''}`, d.author_name);
      }
      for (const a of db.prepare("SELECT id, title, content, author_name, created_at FROM articles WHERE status = 'approved' ORDER BY created_at DESC LIMIT 200").all()) {
        pushItem('article', a, a.title, a.content, a.author_name);
      }
      for (const p of db.prepare('SELECT id, title, content, author, created_at FROM poems ORDER BY created_at DESC LIMIT 200').all()) {
        pushItem('poem', p, p.title, p.content, p.author);
      }
      for (const n of db.prepare('SELECT id, title, content, author, created_at FROM announcements ORDER BY created_at DESC LIMIT 100').all()) {
        pushItem('announcement', n, n.title, n.content, n.author);
      }
      if (includePrivate) {
        for (const b of db.prepare('SELECT id, title, author, description, category, created_at FROM library_books ORDER BY created_at DESC LIMIT 200').all()) {
          pushItem('book', b, b.title, `${b.category || ''} ${b.description || ''}`, b.author);
        }
        for (const l of db.prepare('SELECT id, title, description, teacher_name, folder_name, created_at FROM recorded_lessons ORDER BY created_at DESC LIMIT 200').all()) {
          pushItem('lesson', l, l.title, `${l.folder_name || ''} ${l.description || ''}`, l.teacher_name);
        }
      }
    } catch (e) {}

    results.sort((a, b) => b.createdAt - a.createdAt);
    return {
      ftsEnabled,
      query: rawQuery,
      results: results.slice(0, safeLimit)
    };
  }

  return {
    initSearchIndex,
    rebuildSearchIndex,
    searchAll,
    normalizeKurdishArabic
  };
}

module.exports = { createSearchEngine, normalizeKurdishArabic };

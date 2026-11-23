const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

function escapeHtmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function registerPublicPlatformRoutes(app, { db, dbPath, jwtSecret, searchEngine, publicDir }) {
  // 1. Health Check Endpoint (DB connectivity, WAL mode, disk size, uptime)
  app.get('/api/health', (req, res) => {
    try {
      const check = db.prepare('SELECT 1 AS ok').get();
      let journalMode = 'unknown';
      try {
        const jm = db.prepare('PRAGMA journal_mode').get();
        journalMode = jm ? Object.values(jm)[0] : 'unknown';
      } catch (e) {}

      let dbSizeKB = 0;
      try {
        if (dbPath && fs.existsSync(dbPath)) {
          dbSizeKB = Number((fs.statSync(dbPath).size / 1024).toFixed(1));
        }
      } catch (e) {}

      res.json({
        ok: Boolean(check && check.ok === 1),
        service: 'pryaskay-abdy',
        status: 'healthy',
        uptimeSec: Math.round(process.uptime()),
        db: {
          connected: true,
          journalMode,
          sizeKB: dbSizeKB
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(503).json({
        ok: false,
        status: 'unhealthy',
        error: err.message
      });
    }
  });

  // 2. Global Full-Text Search Endpoint (SQLite FTS5 + Kurdish normalization)
  app.get('/api/search', (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const type = String(req.query.type || 'all').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

      // Detect authenticated members cleanly without requiring login for public content
      let includePrivate = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
          if (decoded && decoded.id) includePrivate = true;
        } catch (e) {}
      }

      if (!q) {
        return res.json({ success: true, query: '', results: [], includePrivate });
      }

      const data = searchEngine.searchAll({ query: q, includePrivate, type, limit });
      res.json({
        success: true,
        query: data.query,
        ftsEnabled: data.ftsEnabled,
        includePrivate,
        count: data.results.length,
        results: data.results
      });
    } catch (err) {
      console.error('Global search error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە گەڕانی گشتیدا' });
    }
  });

  // 3. SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nAllow: /dreams\nAllow: /articles\nAllow: /poems\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  // 4. SEO: Dynamic XML Sitemap
  app.get('/sitemap.xml', (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const urls = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${baseUrl}/dreams`, priority: '0.9', changefreq: 'daily' },
        { loc: `${baseUrl}/articles`, priority: '0.9', changefreq: 'weekly' },
        { loc: `${baseUrl}/poems`, priority: '0.9', changefreq: 'weekly' }
      ];

      try {
        const dreams = db.prepare('SELECT id, created_at FROM dream_posts ORDER BY created_at DESC LIMIT 100').all();
        for (const d of dreams) {
          urls.push({
            loc: `${baseUrl}/dreams?id=${d.id}`,
            lastmod: d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : undefined,
            priority: '0.8',
            changefreq: 'monthly'
          });
        }
      } catch (e) {}

      try {
        const articles = db.prepare("SELECT id, created_at FROM articles WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100").all();
        for (const a of articles) {
          urls.push({
            loc: `${baseUrl}/articles?id=${a.id}`,
            lastmod: a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : undefined,
            priority: '0.8',
            changefreq: 'monthly'
          });
        }
      } catch (e) {}

      try {
        const poems = db.prepare('SELECT id, created_at FROM poems ORDER BY created_at DESC LIMIT 100').all();
        for (const p of poems) {
          urls.push({
            loc: `${baseUrl}/poems?id=${p.id}`,
            lastmod: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : undefined,
            priority: '0.8',
            changefreq: 'monthly'
          });
        }
      } catch (e) {}

      const xmlItems = urls.map((u) => {
        const lastmodTag = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
        return `  <url><loc>${escapeHtmlAttr(u.loc)}</loc>${lastmodTag}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
      }).join('\n');

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>`);
    } catch (err) {
      res.status(500).type('text/plain').send('Error generating sitemap');
    }
  });

  // 5. Dynamic SEO & Open Graph HTML Server for Public Pages
  function buildSeoMeta(req, pageKey) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const id = Number(req.query.id) || 0;
    const defaultImage = `${baseUrl}/images/logo.jpg`;

    const defaults = {
      home: {
        title: 'پریاسکەی عەبدی | پێگەی زانست و لێکدانەوەی خەون',
        description: 'ناوەندێکی زانستی، فیکری و پەروەردەیی بۆ وانە شەرعییەکان، لێکدانەوەی خەون، وتار و شیعری پریاسکەی عەبدی.',
        image: defaultImage,
        url: `${baseUrl}/`
      },
      dreams: {
        title: 'خەونە لێکدراوەکان | پریاسکەی عەبدی',
        description: 'ئەرشیفی خەونە لێکدراوەکان بە ڕاڤەی زانستی و شەرعی لە پریاسکەی عەبدی.',
        image: defaultImage,
        url: `${baseUrl}/dreams`
      },
      articles: {
        title: 'پریاسکەی وتار | پریاسکەی عەبدی',
        description: 'ناوەندێکی زانستی و ئەدەبی بۆ نووسین و بڵاوکردنەوەی وتارە زانستی، ئەدەبی و فیکرییەکان.',
        image: defaultImage,
        url: `${baseUrl}/articles`
      },
      poems: {
        title: 'پریاسکەی شیعر | شیعرەکانی مامۆستا ئازاد',
        description: 'کۆمەڵە شیعر و هەڵبەستە ڕوحانی و ئەدەبییەکانی مامۆستا ئازاد لە پریاسکەی عەبدی.',
        image: defaultImage,
        url: `${baseUrl}/poems`
      }
    };

    const meta = { ...(defaults[pageKey] || defaults.home) };

    if (id > 0) {
      try {
        if (pageKey === 'dreams') {
          const d = db.prepare('SELECT id, title, dream_text, interpretation, image_url FROM dream_posts WHERE id = ?').get(id);
          if (d) {
            meta.title = `${d.title} | خەونە لێکدراوەکان`;
            meta.description = String(d.interpretation || d.dream_text || meta.description).replace(/\s+/g, ' ').slice(0, 170);
            if (d.image_url) meta.image = d.image_url.startsWith('http') ? d.image_url : `${baseUrl}${d.image_url}`;
            meta.url = `${baseUrl}/dreams?id=${d.id}`;
          }
        } else if (pageKey === 'articles') {
          const a = db.prepare("SELECT id, title, content FROM articles WHERE id = ? AND status = 'approved'").get(id);
          if (a) {
            meta.title = `${a.title} | پریاسکەی وتار`;
            meta.description = String(a.content || meta.description).replace(/\s+/g, ' ').slice(0, 170);
            meta.url = `${baseUrl}/articles?id=${a.id}`;
          }
        } else if (pageKey === 'poems') {
          const p = db.prepare('SELECT id, title, content FROM poems WHERE id = ?').get(id);
          if (p) {
            meta.title = `${p.title} | پریاسکەی شیعر`;
            meta.description = String(p.content || meta.description).replace(/\s+/g, ' ').slice(0, 170);
            meta.url = `${baseUrl}/poems?id=${p.id}`;
          }
        }
      } catch (e) {}
    }

    return meta;
  }

  function serveHtmlWithSeo(req, res, filename, pageKey) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const filePath = path.join(publicDir, filename);
    try {
      let html = fs.readFileSync(filePath, 'utf8');
      const meta = buildSeoMeta(req, pageKey);
      const seoBlock = [
        `  <meta name="description" content="${escapeHtmlAttr(meta.description)}">`,
        `  <meta property="og:site_name" content="پریاسکەی عەبدی">`,
        `  <meta property="og:type" content="${req.query.id ? 'article' : 'website'}">`,
        `  <meta property="og:title" content="${escapeHtmlAttr(meta.title)}">`,
        `  <meta property="og:description" content="${escapeHtmlAttr(meta.description)}">`,
        `  <meta property="og:image" content="${escapeHtmlAttr(meta.image)}">`,
        `  <meta property="og:url" content="${escapeHtmlAttr(meta.url)}">`,
        `  <meta name="twitter:card" content="summary_large_image">`,
        `  <meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}">`,
        `  <meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}">`,
        `  <meta name="twitter:image" content="${escapeHtmlAttr(meta.image)}">`
      ].join('\n');

      // Inject Open Graph tags cleanly right before </head> if not already present
      if (!html.includes('property="og:title"')) {
        html = html.replace('</head>', `${seoBlock}\n</head>`);
      }
      if (req.query.id) {
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlAttr(meta.title)}</title>`);
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      return res.sendFile(filePath);
    }
  }

  app.get('/dreams', (req, res) => serveHtmlWithSeo(req, res, 'dreams.html', 'dreams'));
  app.get('/poems', (req, res) => serveHtmlWithSeo(req, res, 'poems.html', 'poems'));
  app.get('/articles', (req, res) => serveHtmlWithSeo(req, res, 'articles.html', 'articles'));
  app.get('/', (req, res) => serveHtmlWithSeo(req, res, 'index.html', 'home'));
}

module.exports = { registerPublicPlatformRoutes };

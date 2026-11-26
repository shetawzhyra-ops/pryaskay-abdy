const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const ALLOWED_AUDIO_EXTS = new Set([
  '.mp3', '.m4a', '.aac', '.wav', '.ogg', '.oga', '.opus', '.flac', '.webm'
]);

const EXT_TO_MIME = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm'
};

function isStrictAudioUpload(file) {
  if (!file) return false;
  const ext = path.extname(String(file.originalname || file.filename || '')).toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase().trim();
  if (!ALLOWED_AUDIO_EXTS.has(ext)) return false;
  // Block video containers even if renamed or sent with video/* MIME
  if (mime.startsWith('video/') || mime.startsWith('image/') || mime.startsWith('text/')) {
    return false;
  }
  return (
    mime === '' ||
    mime.startsWith('audio/') ||
    mime === 'application/ogg' ||
    mime === 'application/octet-stream'
  );
}

function resolveOptionalUser(req, users, jwtSecret) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
    if (decoded && decoded.id) {
      return users.findById(decoded.id) || null;
    }
  } catch (e) {}
  return null;
}

function registerHezaraRoutes(app, {
  hezaraDb,
  users,
  authMiddleware,
  hasSuperAdminPrivileges,
  jwtSecret,
  upload,
  uploadsDir,
  publicDir,
  io
}) {
  function canManageHezara(user) {
    if (!user) return false;
    const role = String(user.role || '').toLowerCase();
    return Boolean(
      role === 'teacher' ||
      role === 'super_admin' ||
      role === 'admin' ||
      (typeof hasSuperAdminPrivileges === 'function' && hasSuperAdminPrivileges(user))
    );
  }

  function requireHezaraTeacher(req, res, next) {
    if (!canManageHezara(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'لەم بەشەدا تەنها مامۆستا دەسەڵاتی دانان و بەڕێوەبردنی دەنگی هەیە'
      });
    }
    next();
  }

  // Page Routes (هەزارەی عەبدی)
  app.get(['/hezara', '/hezarey-abdy'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(publicDir, 'hezara.html'));
  });

  // List all audio tracks (Listeners + Teachers)
  app.get('/api/hezara', (req, res) => {
    try {
      const viewer = resolveOptionalUser(req, users, jwtSecret);
      const tracks = hezaraDb.list();
      const categories = [...new Set(tracks.map((t) => String(t.category || '').trim()).filter(Boolean))];
      res.json({
        success: true,
        canManage: canManageHezara(viewer),
        tracks,
        categories
      });
    } catch (err) {
      console.error('Hezara list error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە بارکردنی تۆمارە دەنگییەکان' });
    }
  });

  // Byte-Range (206 Partial Content) Audio Streamer for uninterrupted background & lock-screen playback on mobile
  app.get('/api/hezara/stream/:id', (req, res) => {
    try {
      const track = hezaraDb.getById(req.params.id);
      if (!track || !track.audio_url) {
        return res.status(404).send('Audio not found');
      }

      const rel = String(track.audio_url).replace(/^\/+uploads\/+/i, '');
      const baseDir = path.resolve(uploadsDir);
      const filePath = path.resolve(baseDir, rel);
      if (!filePath.startsWith(baseDir + path.sep) || !fs.existsSync(filePath)) {
        return res.status(404).send('Audio file missing');
      }

      const stat = fs.statSync(filePath);
      const totalSize = stat.size;
      const ext = path.extname(filePath).toLowerCase();
      const contentType = EXT_TO_MIME[ext] || (String(track.mime_type || '').startsWith('audio/') ? track.mime_type : 'audio/mpeg');

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', 'inline');

      const range = req.headers.range;
      if (range && totalSize > 0) {
        const match = /^bytes=(\d*)-(\d*)$/i.exec(String(range).trim());
        if (!match) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`);
          return res.end();
        }
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= totalSize) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`);
          return res.end();
        }

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Content-Length', end - start + 1);
        if (req.method === 'HEAD') return res.end();
        const stream = fs.createReadStream(filePath, { start, end });
        stream.on('error', () => { if (!res.headersSent) res.status(500).end(); });
        return stream.pipe(res);
      }

      res.status(200);
      res.setHeader('Content-Length', totalSize);
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => { if (!res.headersSent) res.status(500).end(); });
      return stream.pipe(res);
    } catch (err) {
      console.error('Hezara stream error:', err);
      if (!res.headersSent) res.status(500).send('Stream error');
    }
  });

  // Upload strictly audio file or high-quality recording (Teacher / Admin Only)
  app.post('/api/hezara/upload', authMiddleware, requireHezaraTeacher, (req, res) => {
    req.setTimeout(30 * 60 * 1000);
    upload.single('audio')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, error: 'قەبارەی فایلی دەنگی زۆر گەورەیە' });
        }
        return res.status(400).json({ success: false, error: err.message || 'هەڵە لە بارکردنی دەنگدا' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'تکایە فایلی دەنگی هەڵبژێرە یان بە مایکرۆفۆن تۆماری بکە' });
      }
      if (!isStrictAudioUpload(req.file)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({
          success: false,
          error: 'ئەم بەشە تەنها بۆ دەنگە! تکایە فایلی دەنگی هەڵبژێرە (MP3, M4A, WAV, OGG, AAC, FLAC, OPUS)'
        });
      }

      try {
        const title = String(req.body.title || '').trim();
        if (!title) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
          return res.status(400).json({ success: false, error: 'تکایە ناونیشانێک بۆ دەنگەکە بنووسە' });
        }
        const speaker = String(req.body.speaker || req.user.full_name || 'مامۆستا').trim();
        const category = String(req.body.category || '').trim();
        const description = String(req.body.description || '').trim();
        const durationSec = Math.max(0, Number(req.body.duration_sec || 0) || 0);
        const sortOrder = req.body.sort_order ? parseInt(req.body.sort_order, 10) : null;
        const ext = path.extname(req.file.filename).toLowerCase();
        const resolvedMime = EXT_TO_MIME[ext] || req.file.mimetype || 'audio/mpeg';

        const track = hezaraDb.create({
          title,
          speaker,
          category,
          description,
          audio_url: `/uploads/${req.file.filename}`,
          duration_sec: durationSec,
          file_size: req.file.size || 0,
          mime_type: resolvedMime,
          uploader_id: req.user.id,
          uploader_name: req.user.full_name || req.user.username || 'مامۆستا',
          sort_order: sortOrder
        });

        if (io) {
          io.emit('hezara_track_created', { track });
        }
        res.status(201).json({ success: true, track });
      } catch (dbErr) {
        console.error('Hezara create DB error:', dbErr);
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        res.status(500).json({ success: false, error: 'هەڵە لە پاشەکەوتکردنی دەنگ' });
      }
    });
  });

  // Update metadata (Teacher / Admin Only)
  app.put('/api/hezara/:id', authMiddleware, requireHezaraTeacher, (req, res) => {
    try {
      const { title, speaker, category, description, sort_order } = req.body || {};
      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: 'ناونیشانی دەنگ پێویستە' });
      }
      const updated = hezaraDb.update(req.params.id, {
        title,
        speaker,
        category,
        description,
        sort_order
      });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'دەنگەکە نەدۆزرایەوە' });
      }
      if (io) {
        io.emit('hezara_track_updated', { track: updated });
      }
      res.json({ success: true, track: updated });
    } catch (err) {
      console.error('Hezara update error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە نوێکردنەوەی زانیاری' });
    }
  });

  // Delete track + file (Teacher / Admin Only)
  app.delete('/api/hezara/:id', authMiddleware, requireHezaraTeacher, (req, res) => {
    try {
      const removed = hezaraDb.delete(req.params.id);
      if (!removed) {
        return res.status(404).json({ success: false, error: 'دەنگەکە نەدۆزرایەوە' });
      }
      try {
        const rel = String(removed.audio_url || '').replace(/^\/+uploads\/+/i, '');
        const baseDir = path.resolve(uploadsDir);
        const filePath = path.resolve(baseDir, rel);
        if (rel && filePath.startsWith(baseDir + path.sep) && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
      if (io) {
        io.emit('hezara_track_deleted', { id: removed.id });
      }
      res.json({ success: true, id: removed.id });
    } catch (err) {
      console.error('Hezara delete error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە سڕینەوەی دەنگ' });
    }
  });
}

module.exports = { registerHezaraRoutes, isStrictAudioUpload };

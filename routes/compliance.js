const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ALLOWED_REPORT_TARGETS = new Set([
  'comment',
  'message',
  'custom_group_message',
  'article',
  'poem',
  'dream',
  'user'
]);

const ALLOWED_REPORT_REASONS = new Set([
  'harassment',
  'hate_speech',
  'inappropriate',
  'spam',
  'copyright',
  'privacy',
  'other'
]);

function registerComplianceRoutes(app, {
  db,
  users,
  complianceDb,
  authMiddleware,
  publicWriteLimiter,
  requireAdminOrBlackBadge,
  isMasterSuperAdmin,
  jwtSecret,
  io,
  publicDir
}) {
  // 1. Official Privacy Policy & Terms / EULA Pages (Apple App Store & Google Play Mandatory)
  app.get(['/privacy', '/privacy-policy'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(publicDir, 'privacy.html'));
  });

  app.get(['/terms', '/eula'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(publicDir, 'terms.html'));
  });

  // Helper: optional authenticated user extraction for public endpoints (e.g. reporting public comments)
  function getOptionalAuthUser(req) {
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

  // 2. Self-Service In-App Account & Data Deletion (Apple Guideline 5.1.1(v) & Google Play Data Safety)
  function handleSelfDeleteAccount(req, res) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) return res.status(401).json({ success: false, error: 'پێویستە چووبیتە ژوورەوە' });

      const user = users.findById(userId);
      if (!user) return res.status(404).json({ success: false, error: 'هەژمارەکە نەدۆزرایەوە' });

      if (isMasterSuperAdmin(user) || user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'هەژماری سوپەر ئەدمینی سەرەکی بە شێوەی خۆکار ناسڕدرێتەوە بۆ پاراستنی سیستم'
        });
      }

      const password = String(req.body?.password || '');
      if (!password) {
        return res.status(400).json({ success: false, error: 'تکایە وشەی نهێنیی ئێستات بنووسە بۆ دڵنیابوونەوە' });
      }

      const ok = bcrypt.compareSync(password, user.password_hash || '');
      if (!ok) {
        return res.status(401).json({ success: false, error: 'وشەی نهێنی هەڵەیە' });
      }

      // Clean up all user-owned personal records atomically
      complianceDb.purgeUserPersonalData(userId);
      users.delete(userId);

      if (io) {
        io.emit('user_deleted', { user_id: userId, full_name: user.full_name, self_deleted: true });
      }

      return res.json({
        success: true,
        message: 'هەژمارەکەت و تەواوی داتا کەسییەکانت بە یەکجاری سڕدرانەوە.'
      });
    } catch (err) {
      console.error('Self-delete account error:', err);
      return res.status(500).json({ success: false, error: 'هەڵەیەک ڕوویدا لە کاتی سڕینەوەی هەژمار' });
    }
  }

  app.delete('/api/auth/account', authMiddleware, handleSelfDeleteAccount);
  app.post('/api/auth/delete-account', authMiddleware, handleSelfDeleteAccount);

  // 3. UGC Content & User Reporting (Apple Guideline 1.2 & Google Play UGC)
  app.post('/api/reports', publicWriteLimiter, (req, res) => {
    try {
      const authed = getOptionalAuthUser(req);
      const clientId = String(req.headers['x-client-id'] || req.body?.client_id || '').trim().slice(0, 120);

      if (!authed && !clientId) {
        return res.status(400).json({ success: false, error: 'ناسنامەی داواکاری پێویستە' });
      }

      const targetType = String(req.body?.target_type || '').trim().toLowerCase();
      const targetId = Number(req.body?.target_id) || 0;
      const reason = String(req.body?.reason || 'inappropriate').trim().toLowerCase();
      const details = String(req.body?.details || '').trim().slice(0, 500);
      let reportedUserId = Number(req.body?.reported_user_id) || null;
      let reportedName = String(req.body?.reported_name || '').trim().slice(0, 120);
      let contentSnapshot = String(req.body?.content_snapshot || '').trim().slice(0, 400);

      if (!ALLOWED_REPORT_TARGETS.has(targetType) || targetId <= 0) {
        return res.status(400).json({ success: false, error: 'جۆر یان ناسنامەی ناوەڕۆک نادروستە' });
      }
      if (!ALLOWED_REPORT_REASONS.has(reason)) {
        return res.status(400).json({ success: false, error: 'هۆکاری ڕاپۆرت نادروستە' });
      }

      // Enrich content snapshot from DB when possible
      try {
        if (targetType === 'comment') {
          const row = db.prepare('SELECT user_id, author_name, content FROM public_comments WHERE id = ?').get(targetId);
          if (row) {
            reportedUserId = reportedUserId || row.user_id || null;
            reportedName = reportedName || row.author_name || '';
            contentSnapshot = contentSnapshot || String(row.content || '').slice(0, 400);
          }
        } else if (targetType === 'message') {
          const row = db.prepare('SELECT user_id, full_name, content FROM messages WHERE id = ?').get(targetId);
          if (row) {
            reportedUserId = reportedUserId || row.user_id || null;
            reportedName = reportedName || row.full_name || '';
            contentSnapshot = contentSnapshot || String(row.content || '').slice(0, 400);
          }
        } else if (targetType === 'user') {
          const row = users.findById(targetId);
          if (row) {
            reportedUserId = row.id;
            reportedName = reportedName || row.username || row.full_name || '';
          }
        }
      } catch (e) {}

      const report = complianceDb.createReport({
        reporter_user_id: authed ? authed.id : null,
        reporter_client_id: authed ? null : clientId,
        target_type: targetType,
        target_id: targetId,
        reported_user_id: reportedUserId,
        reported_name: reportedName,
        reason,
        details,
        content_snapshot: contentSnapshot
      });

      if (io) {
        io.emit('new_content_report', {
          id: report.id,
          target_type: targetType,
          target_id: targetId,
          reason,
          created_at: report.created_at
        });
      }

      return res.status(201).json({
        success: true,
        report,
        message: 'ڕاپۆرتەکەت تۆمارکرا. تیمی چاودێری لە ماوەی کەمتر لە ٢٤ کاتژمێردا پێداچوونەوەی بۆ دەکات.'
      });
    } catch (err) {
      console.error('Create report error:', err);
      return res.status(500).json({ success: false, error: 'هەڵەیەک ڕوویدا لە ناردنی ڕاپۆرت' });
    }
  });

  // Admin: list & review UGC reports
  app.get('/api/admin/reports', authMiddleware, requireAdminOrBlackBadge, (req, res) => {
    try {
      const status = String(req.query.status || 'all').trim();
      const reports = complianceDb.getReports(status);
      const pendingCount = complianceDb.getPendingReportCount();
      return res.json({ success: true, reports, pendingCount });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'هەڵە لە هێنانی ڕاپۆرتەکان' });
    }
  });

  app.patch('/api/admin/reports/:id', authMiddleware, requireAdminOrBlackBadge, (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body?.status || 'resolved').trim();
      const deleteContent = Boolean(req.body?.delete_content);
      if (!id || !['resolved', 'dismissed', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, error: 'داواکاری نادروستە' });
      }

      const report = complianceDb.findReportById(id);
      if (!report) return res.status(404).json({ success: false, error: 'ڕاپۆرتەکە نەدۆزرایەوە' });

      if (deleteContent) {
        try {
          if (report.target_type === 'comment') {
            db.prepare('DELETE FROM public_comments WHERE id = ?').run(report.target_id);
          } else if (report.target_type === 'message') {
            db.prepare('UPDATE messages SET is_deleted = 1, deleted_at = ? WHERE id = ?').run(Date.now(), report.target_id);
            if (io) io.emit('message_deleted', { id: report.target_id });
          } else if (report.target_type === 'custom_group_message') {
            db.prepare('DELETE FROM custom_group_messages WHERE id = ?').run(report.target_id);
          }
        } catch (e) {}
      }

      complianceDb.updateReportStatus(id, status, req.user.id);
      return res.json({ success: true, message: 'دۆخی ڕاپۆرتەکە نوێکرایەوە' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'هەڵە لە نوێکردنەوەی ڕاپۆرت' });
    }
  });

  // 4. User-to-User Blocking (Apple Guideline 1.2 Immediate Hide + Unblock Management)
  app.get('/api/users/blocks', authMiddleware, (req, res) => {
    try {
      const blocked = complianceDb.getBlockedUsers(req.user.id);
      return res.json({
        success: true,
        blockedIds: blocked.map((b) => b.blocked_user_id),
        blocked
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'هەڵە لە هێنانی لیستی بلۆککراوەکان' });
    }
  });

  app.post('/api/users/blocks', authMiddleware, (req, res) => {
    try {
      const blockedUserId = Number(req.body?.blocked_user_id);
      if (!blockedUserId) return res.status(400).json({ success: false, error: 'ناسنامەی بەکارهێنەر نادروستە' });
      if (blockedUserId === Number(req.user.id)) {
        return res.status(400).json({ success: false, error: 'ناتوانیت خۆت بلۆک بکەیت' });
      }

      const target = users.findById(blockedUserId);
      if (!target) return res.status(404).json({ success: false, error: 'بەکارهێنەر نەدۆزرایەوە' });
      if (isMasterSuperAdmin(target) || target.role === 'super_admin') {
        return res.status(403).json({ success: false, error: 'ناتوانیت بەڕێوەبەری سەرەکی بلۆک بکەیت' });
      }

      complianceDb.blockUser(req.user.id, blockedUserId);
      const blocked = complianceDb.getBlockedUsers(req.user.id);
      return res.status(201).json({
        success: true,
        blockedIds: blocked.map((b) => b.blocked_user_id),
        blocked,
        message: 'بەکارهێنەر بلۆک کرا و پەیامەکانی لات شاردراونەتەوە.'
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'هەڵە لە بلۆککردنی بەکارهێنەر' });
    }
  });

  app.delete('/api/users/blocks/:blockedUserId', authMiddleware, (req, res) => {
    try {
      const blockedUserId = Number(req.params.blockedUserId);
      if (!blockedUserId) return res.status(400).json({ success: false, error: 'ناسنامەی بەکارهێنەر نادروستە' });
      complianceDb.unblockUser(req.user.id, blockedUserId);
      const blocked = complianceDb.getBlockedUsers(req.user.id);
      return res.json({
        success: true,
        blockedIds: blocked.map((b) => b.blocked_user_id),
        blocked,
        message: 'بلۆکی بەکارهێنەر هەڵوەشێنرایەوە.'
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'هەڵە لە لابردنی بلۆک' });
    }
  });
}

module.exports = { registerComplianceRoutes };

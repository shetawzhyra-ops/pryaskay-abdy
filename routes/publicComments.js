const jwt = require('jsonwebtoken');
const {
  isValidEntityType,
  getCountsMap,
  getComments,
  addComment,
  deleteComment
} = require('../lib/comments');

function registerPublicCommentsRoutes(app, { db, users, jwtSecret, io, publicWriteLimiter }) {
  function extractViewer(req) {
    const clientId = String(req.headers['x-client-id'] || '').trim().slice(0, 120);
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
        if (decoded && decoded.id) {
          user = users.findById(decoded.id);
        }
      } catch (e) {}
    }

    const role = user ? String(user.role || '').toLowerCase() : '';
    const isAdmin = Boolean(user && (role === 'super_admin' || role === 'admin' || role === 'teacher'));
    return {
      user,
      userId: user ? user.id : null,
      clientId,
      isAdmin
    };
  }

  // Batch counts per entity type: GET /api/comments/counts?type=poem|article|dream
  app.get('/api/comments/counts', (req, res) => {
    try {
      const type = String(req.query.type || '').trim();
      if (!isValidEntityType(type)) {
        return res.status(400).json({ success: false, error: 'جۆری بڵاوکراوە نادروستە' });
      }
      const counts = getCountsMap(db, type);
      res.json({ success: true, type, counts });
    } catch (err) {
      res.status(500).json({ success: false, error: 'هەڵە لە وەرگرتنی ژمارەی کۆمێنتەکان' });
    }
  });

  // Get comments for a single post: GET /api/comments/:type/:id
  app.get('/api/comments/:type/:id', (req, res) => {
    try {
      const viewer = extractViewer(req);
      const data = getComments(db, req.params.type, req.params.id, viewer);
      if (!data.valid) {
        return res.status(400).json({ success: false, error: data.error });
      }
      res.json({
        success: true,
        type: req.params.type,
        id: Number(req.params.id),
        count: data.count,
        comments: data.comments
      });
    } catch (err) {
      console.error('Get public comments error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە بارکردنی کۆمێنتەکان' });
    }
  });

  // Create comment (Open to general public + logged-in users): POST /api/comments/:type/:id
  app.post('/api/comments/:type/:id', publicWriteLimiter, (req, res) => {
    try {
      const viewer = extractViewer(req);
      if (viewer.user && viewer.user.is_blocked) {
        return res.status(403).json({ success: false, error: 'هەژمارەکەت بلۆک کراوە' });
      }

      const rawName = (req.body && req.body.author_name) ? String(req.body.author_name).trim() : '';
      let authorName = rawName;
      let authorRole = 'visitor';

      if (viewer.user) {
        const uname = String(viewer.user.username || '').toLowerCase();
        const isAzad = uname === 'azad' || viewer.user.id === 6 || (viewer.user.full_name || '').includes('ئازاد');
        if (!authorName) {
          authorName = isAzad ? 'م. ئازاد' : (viewer.user.username || viewer.user.full_name);
        }
        authorRole = viewer.user.role || 'student';
      }

      const content = req.body && req.body.content ? req.body.content : '';
      const clientId = viewer.clientId || (req.body && req.body.client_id ? String(req.body.client_id).trim() : '');

      const result = addComment(db, {
        type: req.params.type,
        id: req.params.id,
        authorName,
        authorUserId: viewer.userId,
        authorRole,
        content,
        clientId
      });

      if (!result.valid) {
        return res.status(result.status || 400).json({ success: false, error: result.error });
      }

      if (io) {
        io.emit('public_comment_created', {
          type: req.params.type,
          entityId: Number(req.params.id),
          comment: { ...result.comment, can_delete: false },
          count: result.count
        });
      }

      res.status(201).json({
        success: true,
        comment: result.comment,
        count: result.count
      });
    } catch (err) {
      console.error('Create public comment error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە ناردنی کۆمێنت' });
    }
  });

  // Delete comment (Moderator/Admin/Teacher OR creator): DELETE /api/comments/:commentId
  app.delete('/api/comments/:commentId', (req, res) => {
    try {
      const viewer = extractViewer(req);
      const result = deleteComment(db, req.params.commentId, viewer);
      if (!result.valid) {
        return res.status(result.status || 400).json({ success: false, error: result.error });
      }

      if (io) {
        io.emit('public_comment_deleted', {
          type: result.entity_type,
          entityId: result.entity_id,
          commentId: Number(req.params.commentId),
          count: result.count
        });
      }

      res.json({
        success: true,
        entity_type: result.entity_type,
        entity_id: result.entity_id,
        count: result.count
      });
    } catch (err) {
      console.error('Delete public comment error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە سڕینەوەی کۆمێنت' });
    }
  });
}

module.exports = { registerPublicCommentsRoutes };

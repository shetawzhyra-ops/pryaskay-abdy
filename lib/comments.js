/**
 * Public Post Comments Engine (Poems, Approved Articles, Interpreted Dreams)
 * Allows general visitors AND logged-in academy members to comment cleanly,
 * with spam throttling, post-existence verification, and moderation controls.
 */

const VALID_ENTITY_TYPES = new Set(['poem', 'article', 'dream']);

function initCommentsTable(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS public_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_user_id INTEGER DEFAULT NULL,
        author_role TEXT DEFAULT 'visitor',
        content TEXT NOT NULL,
        client_id TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_public_comments_entity
        ON public_comments(entity_type, entity_id, created_at DESC);
    `);
  } catch (err) {
    console.error('Error initializing public_comments table:', err.message);
  }
}

function isValidEntityType(type) {
  return VALID_ENTITY_TYPES.has(String(type || '').trim());
}

function verifyTargetExists(db, type, entityId) {
  const id = Number(entityId);
  if (!Number.isInteger(id) || id <= 0) return false;
  try {
    if (type === 'poem') {
      return Boolean(db.prepare('SELECT id FROM poems WHERE id = ?').get(id));
    }
    if (type === 'article') {
      return Boolean(db.prepare("SELECT id FROM articles WHERE id = ? AND status = 'approved'").get(id));
    }
    if (type === 'dream') {
      return Boolean(db.prepare('SELECT id FROM dream_posts WHERE id = ?').get(id));
    }
  } catch (e) {}
  return false;
}

function sanitizeCommentForResponse(row, viewer = {}) {
  const isOwnerByUser = Boolean(viewer.userId && row.author_user_id && Number(row.author_user_id) === Number(viewer.userId));
  const isOwnerByClient = Boolean(viewer.clientId && row.client_id && String(row.client_id) === String(viewer.clientId));
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    author_name: row.author_name,
    author_role: row.author_role || 'visitor',
    content: row.content,
    created_at: row.created_at,
    can_delete: Boolean(viewer.isAdmin || isOwnerByUser || isOwnerByClient)
  };
}

function getCountsMap(db, type) {
  if (!isValidEntityType(type)) return {};
  const rows = db
    .prepare('SELECT entity_id, COUNT(*) AS cnt FROM public_comments WHERE entity_type = ? GROUP BY entity_id')
    .all(type);
  const map = {};
  for (const r of rows) {
    map[String(r.entity_id)] = Number(r.cnt) || 0;
  }
  return map;
}

function getComments(db, type, entityId, viewer = {}) {
  const cleanType = String(type || '').trim();
  const id = Number(entityId);
  if (!isValidEntityType(cleanType) || !Number.isInteger(id) || id <= 0) {
    return { valid: false, error: 'بەش یان ناسنامەی پۆست نادروستە' };
  }

  const rows = db
    .prepare(`
      SELECT id, entity_type, entity_id, author_name, author_user_id, author_role, content, client_id, created_at
      FROM public_comments
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 200
    `)
    .all(cleanType, id);

  return {
    valid: true,
    count: rows.length,
    comments: rows.map((r) => sanitizeCommentForResponse(r, viewer))
  };
}

function addComment(db, { type, id, authorName, authorUserId = null, authorRole = 'visitor', content, clientId = '' }) {
  const cleanType = String(type || '').trim();
  const entityId = Number(id);
  if (!isValidEntityType(cleanType) || !Number.isInteger(entityId) || entityId <= 0) {
    return { valid: false, status: 400, error: 'جۆر یان ناسنامەی بڵاوکراوە نادروستە' };
  }

  if (!verifyTargetExists(db, cleanType, entityId)) {
    return { valid: false, status: 404, error: 'ئەم بڵاوکراوەیە نەدۆزرایەوە' };
  }

  const cleanAuthor = String(authorName || '').replace(/\s+/g, ' ').trim();
  const cleanContent = String(content || '').trim();
  const cleanClient = String(clientId || '').trim().slice(0, 120);

  if (!cleanAuthor || cleanAuthor.length < 2 || cleanAuthor.length > 50) {
    return { valid: false, status: 400, error: 'تکایە ناوەکەت بە دروستی بنووسە (٢ بۆ ٥٠ پیت).' };
  }

  if (!cleanContent || cleanContent.length < 2 || cleanContent.length > 800) {
    return { valid: false, status: 400, error: 'تکایە کۆمێنتەکەت بنووسە (٢ بۆ ٨٠٠ پیت).' };
  }

  // Anti-spam throttle: prevent same client/user from flooding > 1 comment every 3 seconds
  const now = Date.now();
  if (cleanClient) {
    const recent = db
      .prepare('SELECT created_at FROM public_comments WHERE client_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(cleanClient);
    if (recent && now - Number(recent.created_at) < 3000) {
      return { valid: false, status: 429, error: 'تکایە چەند چرکەیەک چاوەڕێ بکە پێش ناردنی کۆمێنتی نوێ.' };
    }
  }

  const res = db
    .prepare(`
      INSERT INTO public_comments (entity_type, entity_id, author_name, author_user_id, author_role, content, client_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(cleanType, entityId, cleanAuthor, authorUserId || null, authorRole || 'visitor', cleanContent, cleanClient, now);

  const inserted = db
    .prepare('SELECT * FROM public_comments WHERE id = ?')
    .get(res.lastInsertRowid);

  const countRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM public_comments WHERE entity_type = ? AND entity_id = ?')
    .get(cleanType, entityId);

  return {
    valid: true,
    status: 201,
    comment: sanitizeCommentForResponse(inserted, { userId: authorUserId, clientId: cleanClient, isAdmin: false }),
    count: countRow ? Number(countRow.cnt) : 1
  };
}

function deleteComment(db, commentId, viewer = {}) {
  const cId = Number(commentId);
  if (!Number.isInteger(cId) || cId <= 0) {
    return { valid: false, status: 400, error: 'ناسنامەی کۆمێنت نادروستە' };
  }

  const row = db.prepare('SELECT * FROM public_comments WHERE id = ?').get(cId);
  if (!row) {
    return { valid: false, status: 404, error: 'کۆمێنتەکە نەدۆزرایەوە' };
  }

  const isOwnerByUser = Boolean(viewer.userId && row.author_user_id && Number(row.author_user_id) === Number(viewer.userId));
  const isOwnerByClient = Boolean(viewer.clientId && row.client_id && String(row.client_id) === String(viewer.clientId));

  if (!viewer.isAdmin && !isOwnerByUser && !isOwnerByClient) {
    return { valid: false, status: 403, error: 'دەسەڵاتی سڕینەوەی ئەم کۆمێنتەت نییە' };
  }

  db.prepare('DELETE FROM public_comments WHERE id = ?').run(cId);
  const countRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM public_comments WHERE entity_type = ? AND entity_id = ?')
    .get(row.entity_type, row.entity_id);

  return {
    valid: true,
    status: 200,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    count: countRow ? Number(countRow.cnt) : 0
  };
}

module.exports = {
  initCommentsTable,
  isValidEntityType,
  verifyTargetExists,
  getCountsMap,
  getComments,
  addComment,
  deleteComment
};

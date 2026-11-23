const path = require('path');
const fs = require('fs');
const multer = require('multer');

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {}

const ALLOWED_EXTENSIONS = new Set([
  // Images (explicitly excluding .svg to prevent stored XSS)
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp',
  // Audio
  '.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.opus', '.flac', '.oga',
  // Video
  '.mp4', '.mov', '.mkv', '.m4v', '.ogv',
  // Documents / Books
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.epub', '.rtf', '.zip', '.rar'
]);

const BLOCKED_EXTENSIONS = new Set([
  '.html', '.htm', '.xhtml', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.svg',
  '.php', '.phtml', '.exe', '.msi', '.bat', '.cmd', '.ps1', '.sh', '.dll', '.vbs', '.jar'
]);

const ALLOWED_MIME_PREFIXES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp',
  'audio/', 'video/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.',
  'application/vnd.ms-',
  'application/epub+zip',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'text/plain',
  'application/octet-stream' // Fallback for some mobile audio/epub blobs checked by extension
];

function isAllowedUpload(originalname, mimetype) {
  const ext = path.extname(String(originalname || '')).toLowerCase();
  const mime = String(mimetype || '').toLowerCase().trim();

  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return { allowed: false, reason: 'ئەم جۆرە فایلە لەبەر ئاسایش ڕێگەپێدراو نییە.' };
  }

  // Explicitly block dangerous MIME types even if extension is omitted (e.g. MediaRecorder blobs)
  if (
    mime.includes('html') ||
    mime.includes('javascript') ||
    mime.includes('svg') ||
    mime.includes('php') ||
    mime.includes('x-msdownload') ||
    mime.includes('x-sh')
  ) {
    return { allowed: false, reason: 'جۆری فایلەکە ڕێگەپێدراو نییە.' };
  }

  const extOk = !ext || ALLOWED_EXTENSIONS.has(ext);
  const mimeOk = !mime || ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));

  if (!extOk || !mimeOk) {
    return { allowed: false, reason: 'تەنها وێنە، دەنگ، ڤیدیۆ و فایلی خوێندن (PDF/کتێب) ڕێگەپێدراون.' };
  }
  return { allowed: true };
}

function createUploadMiddleware(uploadsDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname || '').toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        if (file.mimetype.includes('video')) ext = '.mp4';
        else if (file.mimetype.includes('audio')) ext = '.webm';
        else if (file.mimetype.includes('png')) ext = '.png';
        else if (file.mimetype.includes('webp')) ext = '.webp';
        else if (file.mimetype.includes('pdf')) ext = '.pdf';
        else ext = '.jpg';
      }
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 2048 * 1024 * 1024 }, // Up to 2GB for recorded lessons/books (role-guarded endpoints)
    fileFilter: (req, file, cb) => {
      const check = isAllowedUpload(file.originalname, file.mimetype);
      if (!check.allowed) {
        const err = new Error(check.reason);
        err.statusCode = 400;
        return cb(err, false);
      }
      return cb(null, true);
    }
  });

  /**
   * Automatically optimizes uploaded raster images (JPG/PNG) into compact WebP
   * (max 1600px width, EXIF stripped for privacy, ~70-85% smaller file size).
   */
  async function optimizeSingleFile(file) {
    if (!sharp || !file || !file.path) return file;
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.filename || '').toLowerCase();
    // Skip animated GIFs, already-WebP small files, audio, video, PDFs
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(mime) && !['.jpg', '.jpeg', '.png'].includes(ext)) {
      return file;
    }

    try {
      const parsed = path.parse(file.path);
      const webpFilename = `${parsed.name}.webp`;
      const webpPath = path.join(parsed.dir, webpFilename);

      await sharp(file.path)
        .rotate() // Apply EXIF orientation & strip metadata
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      const newStats = fs.statSync(webpPath);
      const oldStats = fs.existsSync(file.path) ? fs.statSync(file.path) : null;

      // Only replace if WebP actually saved bytes (or original was > 80KB)
      if (!oldStats || newStats.size < oldStats.size || oldStats.size > 80 * 1024) {
        try { fs.unlinkSync(file.path); } catch (e) {}
        file.filename = webpFilename;
        file.path = webpPath;
        file.mimetype = 'image/webp';
        file.size = newStats.size;
      } else {
        try { fs.unlinkSync(webpPath); } catch (e) {}
      }
    } catch (e) {
      // Safe fallback: preserve original uploaded file if sharp fails
    }
    return file;
  }

  async function optimizeUploadedImage(req, res, next) {
    try {
      if (req.file) {
        await optimizeSingleFile(req.file);
      }
      if (Array.isArray(req.files)) {
        for (const f of req.files) await optimizeSingleFile(f);
      } else if (req.files && typeof req.files === 'object') {
        for (const key of Object.keys(req.files)) {
          for (const f of req.files[key]) await optimizeSingleFile(f);
        }
      }
    } catch (e) {}
    next();
  }

  return {
    upload,
    optimizeUploadedImage,
    optimizeSingleFile
  };
}

module.exports = {
  createUploadMiddleware,
  isAllowedUpload,
  ALLOWED_EXTENSIONS,
  BLOCKED_EXTENSIONS
};

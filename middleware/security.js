const rateLimit = require('express-rate-limit');

/**
 * Security Headers Middleware (strict CSP without cdn.tailwindcss.com or unsafe-eval).
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' blob: data:; " +
    "base-uri 'self'; " +
    "object-src 'none'; " +
    "form-action 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.socket.io https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
    "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' blob: data: https: https://*.mp3quran.net; " +
    "connect-src 'self' wss: ws: https: http:; " +
    "frame-ancestors 'self';"
  );
  next();
}

/**
 * Environment-aware CORS policy.
 * In production with ALLOWED_ORIGINS set, restricts cross-origin requests to that allowlist.
 * Always allows same-origin / non-browser requests and localhost during local development.
 */
function createCorsOptions() {
  const rawAllowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (rawAllowed.length > 0) {
        if (rawAllowed.includes(origin)) return callback(null, true);
        if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
      // If ALLOWED_ORIGINS is not configured, allow in dev / same host deployments
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  };
}

/**
 * Strict Rate Limiter for Login / Registration / Password Reset endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'هەوڵی زۆر خێرا درا! تکایە چەند خولەکێک چاوەڕێ بکە پاشان دووبارە هەوڵ بدەوە.'
  }
});

/**
 * Moderate Rate Limiter for Public Write Actions (dream chat creation, reactions, etc.).
 */
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'تکایە کەمێک چاوەڕێ بکە پێش ناردنی داواکاری نوێ.'
  }
});

/**
 * General API Safety Net (prevents scraping/DoS while staying invisible to active classrooms).
 */
const apiGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: {
    error: 'ژمارەی داواکارییەکان لە سنوور دەرچووە، تکایە کەمێک چاوەڕێ بکە.'
  }
});

module.exports = {
  securityHeaders,
  createCorsOptions,
  authLimiter,
  publicWriteLimiter,
  apiGeneralLimiter
};

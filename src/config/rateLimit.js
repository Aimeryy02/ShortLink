const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 900000);
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 10);

const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = rateLimiter;

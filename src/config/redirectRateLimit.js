const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.REDIRECT_RATE_LIMIT_WINDOW_MS || 60000);
const max = Number(process.env.REDIRECT_RATE_LIMIT_MAX_REQUESTS || 120);

const redirectRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many redirect requests, please try again later',
    },
  },
});

module.exports = redirectRateLimiter;

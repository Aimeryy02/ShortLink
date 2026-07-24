const crypto = require('crypto');

const logger = require('../config/logger');

function requireAdminKey(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey || configuredKey.length < 32) {
    logger.error('ADMIN_API_KEY is missing or shorter than 32 characters');
    return res.status(503).json({
      success: false,
      error: {
        message: 'Administration is temporarily unavailable',
      },
    });
  }

  const providedKey = req.get('x-admin-key') || '';

  if (!keysMatch(providedKey, configuredKey)) {
    logger.warn(
      {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
      },
      'Rejected unauthorized administration request',
    );

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid administration key',
      },
    });
  }

  return next();
}

function keysMatch(providedKey, configuredKey) {
  if (!providedKey || !configuredKey) {
    return false;
  }

  const providedDigest = crypto.createHash('sha256').update(providedKey).digest();
  const configuredDigest = crypto.createHash('sha256').update(configuredKey).digest();

  return crypto.timingSafeEqual(providedDigest, configuredDigest);
}

module.exports = {
  keysMatch,
  requireAdminKey,
};

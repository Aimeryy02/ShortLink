const crypto = require('crypto');
const geoip = require('geoip-lite');
const useragent = require('useragent');

const Click = require('../models/Click');
const Link = require('../models/Link');
const logger = require('../config/logger');

async function trackClick(link, req) {
  try {
    logger.info(`Tracking click for link ${link._id}`);

    const agent = useragent.parse(req.headers['user-agent'] || '');
    const referer = req.headers.referer || req.headers.referrer || 'direct';
    const clientIp = getClientIp(req);
    const geo = geoip.lookup(clientIp);
    const clickedAt = new Date();

    await Click.create({
      linkId: link._id,
      clickedAt,
      browser: agent.family || 'unknown',
      os: agent.os?.family || 'unknown',
      device: normalizeDevice(agent.device?.family),
      ip: hashIP(clientIp),
      country: geo?.country || 'unknown',
      referer,
      refererDomain: getRefererDomain(referer),
      language: getLanguage(req),
    });

    await Link.updateOne(
      { _id: link._id },
      {
        $inc: { clicks: 1 },
        $set: { lastClickedAt: clickedAt },
      },
    );
  } catch (error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        linkId: link._id,
      },
      'Click tracking failed',
    );
  }
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function getRefererDomain(referer) {
  if (!referer || referer === 'direct') {
    return 'direct';
  }

  try {
    return new URL(referer).hostname;
  } catch (error) {
    return 'unknown';
  }
}

function getLanguage(req) {
  return req.headers['accept-language']?.split(',')[0] || 'unknown';
}

function normalizeDevice(deviceFamily = 'Other') {
  if (deviceFamily === 'Other') {
    return 'desktop';
  }

  return deviceFamily;
}

module.exports = {
  trackClick,
};

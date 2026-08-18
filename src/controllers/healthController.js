const healthService = require('../services/healthService');

function noStore(res) {
  res.set('Cache-Control', 'no-store, max-age=0');
}

function getHealth(req, res) {
  noStore(res);
  res.status(200).json({ success: true, ...healthService.getLiveness() });
}

async function getReadinessStatus(req, res, next) {
  try {
    const report = await healthService.getReadiness();
    const statusCode = report.status === 'ready' ? 200 : 503;

    noStore(res);
    res.status(statusCode).json({ success: statusCode === 200, ...report });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHealth,
  getReadinessStatus,
};

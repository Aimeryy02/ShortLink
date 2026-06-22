const { getLinkStats } = require('../services/statsService');

async function getStats(req, res, next) {
  try {
    const stats = await getLinkStats(req.params.id, req.query.period || 'all');

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
};

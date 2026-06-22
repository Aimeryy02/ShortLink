const mongoose = require('mongoose');

const Click = require('../models/Click');
const Link = require('../models/Link');
const AppError = require('../utils/AppError');

const PERIODS = {
  '7d': 7,
  '30d': 30,
  all: null,
};

async function getLinkStats(linkId, period = 'all') {
  if (!mongoose.Types.ObjectId.isValid(linkId)) {
    throw new AppError('Invalid link id', 400);
  }

  if (!Object.prototype.hasOwnProperty.call(PERIODS, period)) {
    throw new AppError('Invalid period. Allowed values are 7d, 30d or all', 400);
  }

  const link = await Link.findById(linkId);

  if (!link) {
    throw new AppError('Link not found', 404);
  }

  const match = buildMatch(link._id, period);

  const [
    totalClicks,
    clicksByDay,
    clicksByCountry,
    clicksByBrowser,
    clicksByDevice,
    topReferers,
  ] = await Promise.all([
    Click.countDocuments(match),
    groupClicksByDay(match),
    groupClicksByField(match, 'country'),
    groupClicksByField(match, 'browser'),
    groupClicksByField(match, 'device'),
    groupClicksByField(match, 'refererDomain', 10),
  ]);

  return {
    totalClicks,
    clicksByDay,
    clicksByCountry,
    clicksByBrowser,
    clicksByDevice,
    topReferers,
  };
}

function buildMatch(linkId, period) {
  const match = { linkId };
  const days = PERIODS[period];

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    match.clickedAt = { $gte: since };
  }

  return match;
}

function groupClicksByDay(match) {
  return Click.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$clickedAt',
          },
        },
        clicks: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        clicks: 1,
      },
    },
  ]);
}

function groupClicksByField(match, field, limit) {
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $ifNull: [`$${field}`, 'unknown'] },
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1, _id: 1 } },
    {
      $project: {
        _id: 0,
        value: '$_id',
        clicks: 1,
      },
    },
  ];

  if (limit) {
    pipeline.push({ $limit: limit });
  }

  return Click.aggregate(pipeline);
}

module.exports = {
  getLinkStats,
};

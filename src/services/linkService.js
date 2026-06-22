const Link = require('../models/Link');
const AppError = require('../utils/AppError');
const { generateShortCode } = require('./shortCodeService');
const mongoose = require('mongoose');
const { checkURLSafety } = require('./validationService');

const MAX_SHORT_CODE_ATTEMPTS = 10;

async function createShortLink({ originalUrl, customAlias, expiresAt }) {
  const safety = checkURLSafety(originalUrl);

  if (!safety.isSafe) {
    const error = new AppError('URL detected as phishing', 403);
    error.details = {
      isPhishing: safety.isPhishing,
      reason: safety.reason,
    };
    throw error;
  }

  if (customAlias) {
    const existingAlias = await Link.exists({
      $or: [{ customAlias }, { shortCode: customAlias }],
    });

    if (existingAlias) {
      throw new AppError('Custom alias is already taken', 400);
    }
  }

  const shortCode = await generateUniqueShortCode();

  const link = await Link.create({
    originalUrl,
    shortCode,
    customAlias,
    expiresAt,
  });

  return link;
}

async function generateUniqueShortCode() {
  for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
    const shortCode = generateShortCode();

    // Le code ne doit collisionner ni avec un shortCode ni avec un alias.
    const existingLink = await Link.exists({
      $or: [{ shortCode }, { customAlias: shortCode }],
    });

    if (!existingLink) {
      return shortCode;
    }
  }

  throw new AppError('Unable to generate a unique short code', 500);
}

async function listLinks({ page, limit, sort, order, search, tags }) {
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
    ];
  }

  if (tags?.length) {
    filter.tags = { $all: tags };
  }

  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [links, total] = await Promise.all([
    Link.find(filter).sort({ [sort]: sortDirection }).skip(skip).limit(limit),
    Link.countDocuments(filter),
  ]);

  return {
    links,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function getLinkById(id) {
  validateObjectId(id);

  const link = await Link.findById(id);

  if (!link) {
    throw new AppError('Link not found', 404);
  }

  return link;
}

async function updateLink(id, payload) {
  validateObjectId(id);

  const link = await Link.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!link) {
    throw new AppError('Link not found', 404);
  }

  return link;
}

async function deleteLink(id) {
  validateObjectId(id);

  const link = await Link.findByIdAndDelete(id);

  if (!link) {
    throw new AppError('Link not found', 404);
  }
}

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid link id', 400);
  }
}

module.exports = {
  createShortLink,
  deleteLink,
  getLinkById,
  listLinks,
  updateLink,
};

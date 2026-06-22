const {
  listLinksQuerySchema,
  shortenLinkSchema,
  updateLinkSchema,
} = require('../utils/linkValidation');
const {
  createShortLink,
  deleteLink,
  getLinkById,
  listLinks,
  updateLink,
} = require('../services/linkService');

async function shortenLink(req, res, next) {
  try {
    const payload = shortenLinkSchema.parse(req.body);
    const link = await createShortLink(payload);
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      shortUrl: `${baseUrl}/${link.customAlias || link.shortCode}`,
      shortCode: link.shortCode,
    });
  } catch (error) {
    next(error);
  }
}

async function getLinks(req, res, next) {
  try {
    const query = listLinksQuerySchema.parse(req.query);
    const result = await listLinks(query);

    res.status(200).json({
      success: true,
      links: result.links.map(formatLink),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getLink(req, res, next) {
  try {
    const link = await getLinkById(req.params.id);

    res.status(200).json({
      success: true,
      link: formatLink(link),
    });
  } catch (error) {
    next(error);
  }
}

async function patchLink(req, res, next) {
  try {
    const payload = updateLinkSchema.parse(req.body);
    const link = await updateLink(req.params.id, payload);

    res.status(200).json({
      success: true,
      link: formatLink(link),
    });
  } catch (error) {
    next(error);
  }
}

async function removeLink(req, res, next) {
  try {
    await deleteLink(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Link deleted',
    });
  } catch (error) {
    next(error);
  }
}

function formatLink(link) {
  return {
    id: link._id,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    customAlias: link.customAlias,
    title: link.title,
    isActive: link.isActive,
    expiresAt: link.expiresAt,
    clicks: link.clicks,
    tags: link.tags,
    createdAt: link.createdAt,
  };
}

module.exports = {
  getLink,
  getLinks,
  patchLink,
  removeLink,
  shortenLink,
};

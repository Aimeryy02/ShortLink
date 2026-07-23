const Link = require('../models/Link');
const AppError = require('../utils/AppError');
const { generateQRCode } = require('../services/qrCodeService');

const ALLOWED_QR_SIZES = [200, 400, 600];

async function getQRCode(req, res, next) {
  try {
    const { code } = req.params;
    const size = parseSize(req.query.size);

    const link = await Link.findOne({
      $or: [{ shortCode: code }, { customAlias: code }],
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const qrTargetUrl = `${baseUrl}/${code}`;
    const qrCode = await generateQRCode(qrTargetUrl, size);

    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.type('image/png');
    res.send(qrCode);
  } catch (error) {
    next(error);
  }
}

function parseSize(size) {
  if (size === undefined) {
    return Number(process.env.QR_DEFAULT_SIZE || 400);
  }

  const parsedSize = Number(size);

  if (!ALLOWED_QR_SIZES.includes(parsedSize)) {
    throw new AppError('Invalid QR code size. Allowed values are 200, 400 or 600', 400);
  }

  return parsedSize;
}

module.exports = {
  getQRCode,
};

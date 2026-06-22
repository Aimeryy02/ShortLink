const QRCode = require('qrcode');

async function generateQRCode(url, size) {
  return QRCode.toBuffer(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

module.exports = {
  generateQRCode,
};

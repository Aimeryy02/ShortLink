const Link = require('../models/Link');
const qrService = require('../services/qrCodeService');

jest.mock('../models/Link');
jest.mock('../services/qrCodeService');

const { getQRCode } = require('./qrController');

beforeEach(() => jest.clearAllMocks());

describe('qrController.getQRCode', () => {
  test('renvoie une image PNG lorsque le lien existe', async () => {
    Link.findOne.mockResolvedValue({ shortCode: 'a1' });
    qrService.generateQRCode.mockResolvedValue(Buffer.from([1, 2, 3]));

    const req = { params: { code: 'a1' }, protocol: 'https', get: () => 'host', query: {} };
    const res = { set: jest.fn(), type: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    await getQRCode(req, res, next);

    expect(res.set).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'cross-origin');
    expect(res.type).toHaveBeenCalledWith('image/png');
    expect(res.send).toHaveBeenCalledWith(Buffer.from([1, 2, 3]));
    expect(next).not.toHaveBeenCalled();
  });

  test('size invalide appelle next avec AppError', async () => {
    Link.findOne.mockResolvedValue({ shortCode: 'a1' });

    const req = { params: { code: 'a1' }, protocol: 'https', get: () => 'host', query: { size: '123' } };
    const res = { type: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    await getQRCode(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Invalid QR code size/);
  });
});

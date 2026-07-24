const Click = require('../models/Click');
const Link = require('../models/Link');
const logger = require('../config/logger');

jest.mock('../models/Click');
jest.mock('../models/Link');
jest.mock('../config/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const { trackClick } = require('./analyticsService');

beforeEach(() => jest.clearAllMocks());

describe('analyticsService.trackClick', () => {
  test('crée un Click et incrémente le compteur', async () => {
    const link = { _id: '123' };
    const req = {
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '192.168.1.1',
    };

    Click.create.mockResolvedValue({});
    Link.updateOne.mockResolvedValue({});

    await trackClick(link, req);

    expect(Click.create).toHaveBeenCalledWith(
      expect.objectContaining({
        browser: 'unknown',
        os: 'unknown',
        device: 'desktop',
      }),
    );
    expect(Link.updateOne).toHaveBeenCalledWith(
      { _id: '123' },
      expect.objectContaining({ $inc: { clicks: 1 } })
    );
  });

  test('borne et analyse les informations utiles du user-agent', async () => {
    const link = { _id: '123' };
    const req = {
      headers: {
        'user-agent': `Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile ${'x'.repeat(1000)}`,
      },
      ip: '192.168.1.1',
    };

    Click.create.mockResolvedValue({});
    Link.updateOne.mockResolvedValue({});

    await trackClick(link, req);

    expect(Click.create).toHaveBeenCalledWith(
      expect.objectContaining({
        browser: 'Chrome',
        os: 'Android',
        device: 'mobile',
      }),
    );
  });

  test('gère les erreurs sans lever d\'exception', async () => {
    const link = { _id: '123' };
    const req = { headers: {}, ip: '192.168.1.1' };

    Click.create.mockRejectedValue(new Error('DB error'));

    await trackClick(link, req);

    expect(logger.error).toHaveBeenCalled();
  });
});

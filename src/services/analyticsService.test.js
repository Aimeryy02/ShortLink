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

  test("n'enregistre ni l'adresse IP ni le referer complet, seulement le domaine", async () => {
    const link = { _id: '123' };
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        referer: 'https://exemple.org/newsletter?email=jean@exemple.org&token=abc',
        'accept-language': 'fr-FR,fr;q=0.9',
      },
      ip: '10.0.0.1',
    };

    Click.create.mockResolvedValue({});
    Link.updateOne.mockResolvedValue({});

    await trackClick(link, req);

    const payload = Click.create.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ refererDomain: 'exemple.org', language: 'fr-FR' }));
    expect(payload).not.toHaveProperty('ip');
    expect(payload).not.toHaveProperty('referer');

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('203.0.113.7');
    expect(serialized).not.toContain('10.0.0.1');
    expect(serialized).not.toContain('jean@exemple.org');
    expect(serialized).not.toContain('token=abc');
  });

  test('gère les erreurs sans lever d\'exception', async () => {
    const link = { _id: '123' };
    const req = { headers: {}, ip: '192.168.1.1' };

    Click.create.mockRejectedValue(new Error('DB error'));

    await trackClick(link, req);

    expect(logger.error).toHaveBeenCalled();
  });
});

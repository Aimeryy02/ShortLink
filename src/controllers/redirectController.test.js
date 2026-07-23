const Link = require('../models/Link');
const analytics = require('../services/analyticsService');

jest.mock('../models/Link');
jest.mock('../services/analyticsService', () => ({ trackClick: jest.fn() }));
jest.mock('../config/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const { previewLink, redirectToOriginalUrl } = require('./redirectController');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('redirectController.previewLink', () => {
  test('envoie une page de preview HTML avec URL échappée et lien continuer', async () => {
    Link.findOne.mockResolvedValue({
      originalUrl: 'http://example.com?foo=<bar>&',
      shortCode: 'abc',
      isActive: true,
    });

    const req = { params: { code: 'abc' } };
    const res = { type: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    await previewLink(req, res, next);

    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalled();
    const html = res.send.mock.calls[0][0];
    expect(html).toContain('http://example.com?foo=&lt;bar&gt;&amp;');
    expect(html).toContain('href="/abc"');
    expect(next).not.toHaveBeenCalled();
  });

  test('lorsque le lien n\'existe pas appelle next avec erreur', async () => {
    Link.findOne.mockResolvedValue(null);

    const req = { params: { code: 'nope' } };
    const res = { type: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    await previewLink(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Link not found');
  });
});

describe('redirectController.redirectToOriginalUrl', () => {
  test('redirige vers l\'URL originale et trackClick est appelé', async () => {
    const link = {
      originalUrl: 'https://site.example/page',
      shortCode: 'xyz',
      isActive: true,
      _id: '123',
    };
    Link.findOne.mockResolvedValue(link);
    analytics.trackClick.mockResolvedValue();

    const req = { params: { code: 'xyz' } };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    await redirectToOriginalUrl(req, res, next);

    expect(analytics.trackClick).toHaveBeenCalledWith(link, req);
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://site.example/page');
    expect(next).not.toHaveBeenCalled();
  });

  test('si le lien est désactivé appelle next avec erreur', async () => {
    Link.findOne.mockResolvedValue({ isActive: false });

    const req = { params: { code: 'off' } };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    await redirectToOriginalUrl(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Link is disabled');
  });
});

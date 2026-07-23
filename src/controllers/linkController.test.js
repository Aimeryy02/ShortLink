const linkService = require('../services/linkService');
const validation = require('../utils/linkValidation');

jest.mock('../services/linkService');
jest.mock('../utils/linkValidation', () => ({
  shortenLinkSchema: { parse: (v) => v },
  listLinksQuerySchema: { parse: (v) => ({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' }) },
  updateLinkSchema: { parse: (v) => v },
}));

const { shortenLink, getLinks, getLink, patchLink, removeLink } = require('./linkController');

beforeEach(() => jest.clearAllMocks());

describe('linkController.shortenLink', () => {
  test('retourne shortUrl et shortCode', async () => {
    linkService.createShortLink.mockResolvedValue({ shortCode: 'abc', customAlias: null });

    const req = { body: { originalUrl: 'http://x' }, protocol: 'https', get: () => 'host' };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await shortenLink(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ shortCode: 'abc' }));
  });
});

describe('linkController.getLinks/getLink/patchLink/removeLink', () => {
  test('getLinks renvoie formaté', async () => {
    linkService.listLinks.mockResolvedValue({ links: [{ _id: '1', originalUrl: 'u' }], pagination: { page: 1 } });
    const req = { query: {} };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await getLinks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getLink renvoie link formaté', async () => {
    linkService.getLinkById.mockResolvedValue({ _id: '1', originalUrl: 'u' });
    const req = { params: { id: '1' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await getLink(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('patchLink renvoie link mis à jour', async () => {
    linkService.updateLink.mockResolvedValue({ _id: '1', originalUrl: 'u' });
    const req = { params: { id: '1' }, body: { title: 't' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await patchLink(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('removeLink supprime et renvoie message', async () => {
    linkService.deleteLink.mockResolvedValue();
    const req = { params: { id: '1' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await removeLink(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Link deleted' }));
  });
});

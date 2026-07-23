jest.mock('../models/Link');
jest.mock('./shortCodeService');
jest.mock('./validationService', () => ({ checkURLSafety: jest.fn() }));

const mongoose = require('mongoose');
const Link = require('../models/Link');
const shortCodeService = require('./shortCodeService');
const validationService = require('./validationService');
const { createShortLink, getLinkById, listLinks, updateLink, deleteLink } = require('./linkService');

const validObjectId = new mongoose.Types.ObjectId();

beforeEach(() => jest.clearAllMocks());

describe('linkService.createShortLink', () => {
  test('rejette lorsqu\'il s\'agit d\'un phishing', async () => {
    validationService.checkURLSafety.mockReturnValue({ isSafe: false, isPhishing: true, reason: 'x' });

    await expect(createShortLink({ originalUrl: 'http://bad' })).rejects.toThrow('URL detected as phishing');
  });

  test('rejette si customAlias pris', async () => {
    validationService.checkURLSafety.mockReturnValue({ isSafe: true });
    Link.exists.mockResolvedValue(true);

    await expect(createShortLink({ originalUrl: 'http://ok', customAlias: 'taken' })).rejects.toThrow(
      'Custom alias is already taken',
    );
  });

  test('crée un lien quand tout est ok', async () => {
    validationService.checkURLSafety.mockReturnValue({ isSafe: true });
    Link.exists.mockResolvedValue(false);
    shortCodeService.generateShortCode.mockReturnValue('abc123');
    Link.create.mockResolvedValue({ originalUrl: 'http://ok', shortCode: 'abc123', title: 'Mon lien' });

    const link = await createShortLink({ originalUrl: 'http://ok', title: 'Mon lien' });

    expect(link).toBeDefined();
    expect(Link.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalUrl: 'http://ok', title: 'Mon lien' }),
    );
  });
});

describe('linkService.getLinkById', () => {
  test('retourne le lien si trouvé', async () => {
    Link.findById.mockResolvedValue({ _id: validObjectId, originalUrl: 'http://x' });

    const link = await getLinkById(validObjectId.toString());

    expect(link).toBeDefined();
    expect(link._id).toEqual(validObjectId);
  });

  test('rejette lien non trouvé', async () => {
    Link.findById.mockResolvedValue(null);

    await expect(getLinkById(validObjectId.toString())).rejects.toThrow('Link not found');
  });

  test('rejette ID invalide', async () => {
    await expect(getLinkById('invalid')).rejects.toThrow('Invalid link id');
  });
});

describe('linkService.listLinks', () => {
  test('retourne liste paginée', async () => {
    Link.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ _id: validObjectId }]),
    });
    Link.countDocuments.mockResolvedValue(1);

    const result = await listLinks({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' });

    expect(result.links).toHaveLength(1);
    expect(result.pagination.page).toBe(1);
  });

  test('applique filtre search', async () => {
    Link.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    Link.countDocuments.mockResolvedValue(0);

    await listLinks({ page: 1, limit: 10, sort: 'createdAt', order: 'desc', search: 'test' });

    expect(Link.find).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) })
    );
  });

  test('applique filtre tags', async () => {
    Link.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    Link.countDocuments.mockResolvedValue(0);

    await listLinks({ page: 1, limit: 10, sort: 'createdAt', order: 'desc', tags: ['tag1'] });

    expect(Link.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: { $all: ['tag1'] } })
    );
  });
});

describe('linkService.updateLink', () => {
  test('met à jour et retourne lien', async () => {
    Link.findByIdAndUpdate.mockResolvedValue({ _id: validObjectId, title: 'new' });

    const link = await updateLink(validObjectId.toString(), { title: 'new' });

    expect(link.title).toBe('new');
  });

  test('rejette si lien non trouvé', async () => {
    Link.findByIdAndUpdate.mockResolvedValue(null);

    await expect(updateLink(validObjectId.toString(), {})).rejects.toThrow('Link not found');
  });

  test('rejette ID invalide', async () => {
    await expect(updateLink('invalid', {})).rejects.toThrow('Invalid link id');
  });
});

describe('linkService.deleteLink', () => {
  test('supprime le lien', async () => {
    Link.findByIdAndDelete.mockResolvedValue({ _id: validObjectId });

    await expect(deleteLink(validObjectId.toString())).resolves.not.toThrow();
  });

  test('rejette si lien non trouvé', async () => {
    Link.findByIdAndDelete.mockResolvedValue(null);

    await expect(deleteLink(validObjectId.toString())).rejects.toThrow('Link not found');
  });

  test('rejette ID invalide', async () => {
    await expect(deleteLink('invalid')).rejects.toThrow('Invalid link id');
  });
});

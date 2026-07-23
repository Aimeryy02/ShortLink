const Link = require('../models/Link');
const Click = require('../models/Click');
const mongoose = require('mongoose');

jest.mock('../models/Link');
jest.mock('../models/Click');

const { getLinkStats } = require('./statsService');

const validObjectId = new mongoose.Types.ObjectId();

beforeEach(() => jest.clearAllMocks());

describe('statsService.getLinkStats', () => {
  test('retourne stats avec tous les clics', async () => {
    Link.findById.mockResolvedValue({ _id: validObjectId });
    Click.countDocuments.mockResolvedValue(10);
    Click.aggregate.mockResolvedValue([]);

    const stats = await getLinkStats(validObjectId.toString(), 'all');

    expect(stats.totalClicks).toBe(10);
    expect(stats).toHaveProperty('clicksByDay');
    expect(stats).toHaveProperty('clicksByCountry');
  });

  test('filtre par période 7d', async () => {
    Link.findById.mockResolvedValue({ _id: validObjectId });
    Click.countDocuments.mockResolvedValue(5);
    Click.aggregate.mockResolvedValue([]);

    const stats = await getLinkStats(validObjectId.toString(), '7d');

    expect(stats.totalClicks).toBe(5);
    expect(Click.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
      linkId: validObjectId,
      clickedAt: expect.anything(),
    }));
  });

  test('rejette ID invalide', async () => {
    await expect(getLinkStats('invalid')).rejects.toThrow('Invalid link id');
  });

  test('rejette lien non trouvé', async () => {
    Link.findById.mockResolvedValue(null);

    await expect(getLinkStats(validObjectId.toString())).rejects.toThrow('Link not found');
  });

  test('rejette période invalide', async () => {
    Link.findById.mockResolvedValue({ _id: validObjectId });

    await expect(getLinkStats(validObjectId.toString(), 'invalid')).rejects.toThrow('Invalid period');
  });
});

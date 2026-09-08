jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: { on: jest.fn() },
}));
jest.mock('../models/Click', () => ({ syncIndexes: jest.fn() }));
jest.mock('./logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const mongoose = require('mongoose');
const Click = require('../models/Click');
const logger = require('./logger');
const connectDatabase = require('./database');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.MONGO_URI = 'mongodb://localhost:27017/shortlink-test';
});

afterAll(() => {
  delete process.env.MONGO_URI;
});

describe('config/database.connectDatabase', () => {
  test('refuse de démarrer sans MONGO_URI', async () => {
    delete process.env.MONGO_URI;

    await expect(connectDatabase()).rejects.toThrow('MONGO_URI is required');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test('se connecte puis synchronise les index de la collection des clics', async () => {
    mongoose.connect.mockResolvedValue();
    Click.syncIndexes.mockResolvedValue(['clickedAt_1']);

    await connectDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/shortlink-test');
    expect(Click.syncIndexes).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ droppedIndexes: ['clickedAt_1'], retentionDays: 395 }),
      expect.stringContaining('index'),
    );
  });

  test("journalise l'échec de synchronisation sans empêcher le démarrage", async () => {
    mongoose.connect.mockResolvedValue();
    Click.syncIndexes.mockRejectedValue(new Error('IndexOptionsConflict'));

    await expect(connectDatabase()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ message: 'IndexOptionsConflict' }) }),
      expect.stringContaining('index'),
    );
  });
});

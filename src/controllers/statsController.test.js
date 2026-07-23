const statsService = require('../services/statsService');

jest.mock('../services/statsService');

const { getStats } = require('./statsController');

beforeEach(() => jest.clearAllMocks());

describe('statsController.getStats', () => {
  test('retourne les stats', async () => {
    statsService.getLinkStats.mockResolvedValue({ clicks: 10 });
    const req = { params: { id: '1' }, query: {} };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await getStats(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, stats: { clicks: 10 } }));
  });
});

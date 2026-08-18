const healthService = require('../services/healthService');

jest.mock('../services/healthService');

const { getHealth, getReadinessStatus } = require('./healthController');

function createResponse() {
  return {
    set: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

beforeEach(() => jest.clearAllMocks());

describe('healthController.getHealth', () => {
  test('repond 200 avec le rapport de vivacite', () => {
    healthService.getLiveness.mockReturnValue({ status: 'alive', uptimeSeconds: 12 });

    const res = createResponse();
    getHealth({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, status: 'alive', uptimeSeconds: 12 });
  });

  test('interdit la mise en cache de la reponse de sonde', () => {
    healthService.getLiveness.mockReturnValue({ status: 'alive' });

    const res = createResponse();
    getHealth({}, res);

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store, max-age=0');
  });
});

describe('healthController.getReadinessStatus', () => {
  test('repond 200 lorsque le service est ready', async () => {
    healthService.getReadiness.mockResolvedValue({ status: 'ready', probes: [] });

    const res = createResponse();
    const next = jest.fn();

    await getReadinessStatus({}, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, status: 'ready', probes: [] });
    expect(next).not.toHaveBeenCalled();
  });

  test('repond 503 lorsque le service est degraded', async () => {
    healthService.getReadiness.mockResolvedValue({
      status: 'degraded',
      probes: [{ name: 'mongodb', status: 'down' }],
    });

    const res = createResponse();
    const next = jest.fn();

    await getReadinessStatus({}, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, status: 'degraded' }),
    );
  });

  test('delegue les erreurs inattendues au middleware d erreur', async () => {
    healthService.getReadiness.mockRejectedValue(new Error('probe crashed'));

    const res = createResponse();
    const next = jest.fn();

    await getReadinessStatus({}, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});

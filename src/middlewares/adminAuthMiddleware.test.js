const logger = require('../config/logger');
const { keysMatch, requireAdminKey } = require('./adminAuthMiddleware');

jest.mock('../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('adminAuthMiddleware', () => {
  const validAdminKey = 'a-secure-administration-key-123456';
  const previousKey = process.env.ADMIN_API_KEY;

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.ADMIN_API_KEY;
    } else {
      process.env.ADMIN_API_KEY = previousKey;
    }
    jest.clearAllMocks();
  });

  test('accepte une clé identique', () => {
    expect(keysMatch('secret', 'secret')).toBe(true);
  });

  test('rejette une clé absente ou différente', () => {
    expect(keysMatch('', 'secret')).toBe(false);
    expect(keysMatch('wrong', 'secret')).toBe(false);
  });

  test('retourne 503 si la clé serveur est absente', () => {
    delete process.env.ADMIN_API_KEY;
    const req = { get: jest.fn(), method: 'GET', originalUrl: '/api/links', ip: '127.0.0.1' };
    const res = createResponse();
    const next = jest.fn();

    requireAdminKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  test('retourne 503 si la clé serveur est trop courte', () => {
    process.env.ADMIN_API_KEY = 'too-short';
    const req = { get: jest.fn(), method: 'GET', originalUrl: '/api/links', ip: '127.0.0.1' };
    const res = createResponse();
    const next = jest.fn();

    requireAdminKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  test('retourne 401 sans exposer la clé reçue', () => {
    process.env.ADMIN_API_KEY = validAdminKey;
    const req = {
      get: jest.fn().mockReturnValue('wrong-key'),
      method: 'PATCH',
      originalUrl: '/api/links/123',
      ip: '127.0.0.1',
    };
    const res = createResponse();
    const next = jest.fn();

    requireAdminKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.not.objectContaining({ key: expect.anything() }),
      expect.any(String),
    );
  });

  test('laisse passer une requête autorisée', () => {
    process.env.ADMIN_API_KEY = validAdminKey;
    const req = {
      get: jest.fn().mockReturnValue(validAdminKey),
      method: 'GET',
      originalUrl: '/api/links',
      ip: '127.0.0.1',
    };
    const res = createResponse();
    const next = jest.fn();

    requireAdminKey(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

const mongoose = require('mongoose');

const {
  getLiveness,
  getReadiness,
  checkDatabase,
  checkAdminKey,
  checkMemory,
  MIN_ADMIN_KEY_LENGTH,
} = require('./healthService');

const VALID_KEY = 'k'.repeat(MIN_ADMIN_KEY_LENGTH);
const originalAdminKey = process.env.ADMIN_API_KEY;

function mockConnection({ readyState, ping }) {
  Object.defineProperty(mongoose.connection, 'readyState', {
    value: readyState,
    configurable: true,
  });

  Object.defineProperty(mongoose.connection, 'db', {
    value: ping ? { admin: () => ({ ping }) } : undefined,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  process.env.ADMIN_API_KEY = originalAdminKey;
});

describe('healthService.getLiveness', () => {
  test('rapporte le service vivant avec sa version et son uptime', () => {
    const liveness = getLiveness();

    expect(liveness.status).toBe('alive');
    expect(liveness.service).toBe('shortlink-api');
    expect(typeof liveness.version).toBe('string');
    expect(liveness.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(Date.parse(liveness.timestamp))).toBe(false);
  });
});

describe('healthService.checkDatabase', () => {
  test('sonde up lorsque le ping MongoDB répond', async () => {
    mockConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });

    const probe = await checkDatabase();

    expect(probe.name).toBe('mongodb');
    expect(probe.status).toBe('up');
    expect(probe.readyState).toBe('connected');
    expect(probe.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('sonde down lorsque la connexion n est pas etablie', async () => {
    mockConnection({ readyState: 0, ping: null });

    const probe = await checkDatabase();

    expect(probe.status).toBe('down');
    expect(probe.readyState).toBe('disconnected');
    expect(probe.error).toMatch(/not established/);
  });

  test('sonde down lorsque le ping MongoDB echoue', async () => {
    mockConnection({ readyState: 1, ping: jest.fn().mockRejectedValue(new Error('no primary')) });

    const probe = await checkDatabase();

    expect(probe.status).toBe('down');
    expect(probe.error).toBe('no primary');
  });

  test('sonde down lorsque le ping MongoDB depasse le delai', async () => {
    mockConnection({ readyState: 1, ping: () => new Promise(() => {}) });

    const probe = await checkDatabase(20);

    expect(probe.status).toBe('down');
    expect(probe.error).toMatch(/timed out after 20 ms/);
  });
});

describe('healthService.checkAdminKey', () => {
  test('sonde up lorsque la cle est configuree et suffisamment longue', () => {
    process.env.ADMIN_API_KEY = VALID_KEY;

    const probe = checkAdminKey();

    expect(probe.status).toBe('up');
    expect(probe.configured).toBe(true);
  });

  test('sonde down lorsque la cle est trop courte', () => {
    process.env.ADMIN_API_KEY = 'trop-court';

    const probe = checkAdminKey();

    expect(probe.status).toBe('down');
    expect(probe.configured).toBe(false);
  });

  test('sonde down lorsque la cle est absente', () => {
    delete process.env.ADMIN_API_KEY;

    const probe = checkAdminKey();

    expect(probe.status).toBe('down');
  });

  test('ne divulgue jamais la valeur de la cle', () => {
    process.env.ADMIN_API_KEY = VALID_KEY;

    expect(JSON.stringify(checkAdminKey())).not.toContain(VALID_KEY);
  });
});

describe('healthService.checkMemory', () => {
  test('rapporte la memoire consommee sans etre bloquante', () => {
    const probe = checkMemory();

    expect(probe.critical).toBe(false);
    expect(probe.status).toBe('up');
    expect(probe.heapUsedMb).toBeGreaterThan(0);
    expect(probe.rssMb).toBeGreaterThan(0);
  });
});

describe('healthService.getReadiness', () => {
  test('ready lorsque toutes les sondes critiques sont up', async () => {
    process.env.ADMIN_API_KEY = VALID_KEY;
    mockConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });

    const report = await getReadiness();

    expect(report.status).toBe('ready');
    expect(report.probes.map((probe) => probe.name)).toEqual(['mongodb', 'admin_key', 'memory']);
  });

  test('degraded lorsque MongoDB est injoignable', async () => {
    process.env.ADMIN_API_KEY = VALID_KEY;
    mockConnection({ readyState: 0, ping: null });

    const report = await getReadiness();

    expect(report.status).toBe('degraded');
  });

  test('degraded lorsque la cle d administration est absente', async () => {
    delete process.env.ADMIN_API_KEY;
    mockConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });

    const report = await getReadiness();

    expect(report.status).toBe('degraded');
  });

  test('une sonde non critique en echec ne degrade pas le service', async () => {
    process.env.ADMIN_API_KEY = VALID_KEY;
    mockConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });

    const report = await getReadiness();
    const memory = report.probes.find((probe) => probe.name === 'memory');

    expect(memory.critical).toBe(false);
    expect(report.status).toBe('ready');
  });
});

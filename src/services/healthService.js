const mongoose = require('mongoose');

const { version } = require('../../package.json');

const DB_PING_TIMEOUT_MS = Number(process.env.HEALTH_DB_TIMEOUT_MS || 2000);
const MIN_ADMIN_KEY_LENGTH = 32;

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function withTimeout(promise, timeoutMs, message) {
  let timer;

  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    if (timer.unref) {
      timer.unref();
    }
  });

  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    timeout,
  ]);
}

function getLiveness() {
  return {
    status: 'alive',
    service: 'shortlink-api',
    version,
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

async function checkDatabase(timeoutMs = DB_PING_TIMEOUT_MS) {
  const readyState = mongoose.connection.readyState;
  const readyStateLabel = READY_STATE_LABELS[readyState] || 'unknown';

  const probe = {
    name: 'mongodb',
    critical: true,
    status: 'down',
    readyState: readyStateLabel,
    latencyMs: null,
  };

  if (readyState !== 1 || !mongoose.connection.db) {
    return { ...probe, error: 'Database connection is not established' };
  }

  const startedAt = Date.now();

  try {
    await withTimeout(
      mongoose.connection.db.admin().ping(),
      timeoutMs,
      `Database ping timed out after ${timeoutMs} ms`,
    );

    return { ...probe, status: 'up', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ...probe,
      latencyMs: Date.now() - startedAt,
      error: error.message,
    };
  }
}

function checkAdminKey() {
  const adminKey = process.env.ADMIN_API_KEY;
  const configured = typeof adminKey === 'string' && adminKey.length >= MIN_ADMIN_KEY_LENGTH;

  return {
    name: 'admin_key',
    critical: true,
    status: configured ? 'up' : 'down',
    configured,
    ...(configured
      ? {}
      : { error: `ADMIN_API_KEY is missing or shorter than ${MIN_ADMIN_KEY_LENGTH} characters` }),
  };
}

function checkMemory() {
  const { heapUsed, rss } = process.memoryUsage();

  return {
    name: 'memory',
    critical: false,
    status: 'up',
    heapUsedMb: Math.round((heapUsed / 1024 / 1024) * 10) / 10,
    rssMb: Math.round((rss / 1024 / 1024) * 10) / 10,
  };
}

async function getReadiness() {
  const probes = [await checkDatabase(), checkAdminKey(), checkMemory()];
  const failed = probes.filter((probe) => probe.critical && probe.status !== 'up');

  return {
    status: failed.length === 0 ? 'ready' : 'degraded',
    service: 'shortlink-api',
    version,
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    probes,
  };
}

module.exports = {
  getLiveness,
  getReadiness,
  checkDatabase,
  checkAdminKey,
  checkMemory,
  DB_PING_TIMEOUT_MS,
  MIN_ADMIN_KEY_LENGTH,
};

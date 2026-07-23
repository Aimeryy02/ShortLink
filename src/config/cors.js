const LOCAL_CLIENT_ORIGINS = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

function getAllowedOrigins(env = process.env) {
  const configuredOrigins = (env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (env.NODE_ENV === 'production') {
    return new Set(configuredOrigins);
  }

  return new Set([...LOCAL_CLIENT_ORIGINS, ...configuredOrigins]);
}

function createCorsOptions(env = process.env) {
  const allowedOrigins = getAllowedOrigins(env);

  return {
    origin(origin, callback) {
      const isAllowed = !origin || allowedOrigins.has(origin);
      callback(null, isAllowed);
    },
  };
}

module.exports = {
  createCorsOptions,
  getAllowedOrigins,
};

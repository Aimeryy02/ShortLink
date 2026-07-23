const { createCorsOptions, getAllowedOrigins } = require('./cors');

function checkOrigin(options, origin) {
  return new Promise((resolve, reject) => {
    options.origin(origin, (error, isAllowed) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(isAllowed);
    });
  });
}

describe('configuration CORS', () => {
  test('autorise uniquement les origines configurées en production', async () => {
    const options = createCorsOptions({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://short-link-omega.vercel.app',
    });

    await expect(checkOrigin(options, 'https://short-link-omega.vercel.app')).resolves.toBe(true);
    await expect(checkOrigin(options, 'https://example.com')).resolves.toBe(false);
    await expect(checkOrigin(options, 'http://localhost:5173')).resolves.toBe(false);
  });

  test('accepte plusieurs origines séparées par une virgule', () => {
    const origins = getAllowedOrigins({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app.example.com, https://preview.example.com',
    });

    expect(origins).toEqual(new Set([
      'https://app.example.com',
      'https://preview.example.com',
    ]));
  });

  test('autorise les clients locaux hors production', async () => {
    const options = createCorsOptions({ NODE_ENV: 'development' });

    await expect(checkOrigin(options, 'http://127.0.0.1:5173')).resolves.toBe(true);
    await expect(checkOrigin(options, 'http://localhost:5173')).resolves.toBe(true);
  });

  test('autorise une requête sans en-tête Origin', async () => {
    const options = createCorsOptions({ NODE_ENV: 'production' });

    await expect(checkOrigin(options, undefined)).resolves.toBe(true);
  });
});

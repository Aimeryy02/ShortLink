const Link = require('../models/Link');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { trackClick } = require('../services/analyticsService');

async function previewLink(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store');
    const code = req.params.code || req.params[0];

    const link = await Link.findOne({
      $or: [{ shortCode: code }, { customAlias: code }],
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    if (!link.isActive) {
      throw new AppError('Link is disabled', 403);
    }

    if (link.expiresAt && link.expiresAt <= new Date()) {
      throw new AppError('Link expired', 410);
    }

    res.type('html');
    res.send(renderPreviewPage(link.originalUrl, code));
  } catch (error) {
    next(error);
  }
}

async function redirectToOriginalUrl(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store');
    logger.info({ code: req.params.code }, 'Redirect route hit');

    const { code } = req.params;

    const link = await Link.findOne({
      $or: [{ shortCode: code }, { customAlias: code }],
    });

    if (!link) {
      throw new AppError('Link not found', 404);
    }

    if (!link.isActive) {
      throw new AppError('Link is disabled', 403);
    }

    if (link.expiresAt && link.expiresAt <= new Date()) {
      throw new AppError('Link expired', 410);
    }

    await trackClick(link, req);
    logger.info({ linkId: link._id }, 'Tracking finished');

    res.redirect(302, link.originalUrl);
  } catch (error) {
    next(error);
  }
}

function renderPreviewPage(originalUrl, code) {
  const safeUrl = escapeHtml(originalUrl);
  const continueHref = `/${encodeURIComponent(code)}`;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Preview ShortLink</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
        background: #f3f4f6;
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #f3f4f6;
      }

      main {
        width: min(100%, 560px);
        padding: 32px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
      }

      h1 {
        margin: 0 0 16px;
        font-size: clamp(1.5rem, 4vw, 2rem);
        line-height: 1.2;
      }

      .url-box {
        overflow-wrap: anywhere;
        margin: 0 0 18px;
        padding: 14px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #f9fafb;
        font-family: Consolas, Monaco, monospace;
        font-size: 0.95rem;
      }

      .warning {
        margin: 0 0 24px;
        color: #4b5563;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .button-link {
        min-height: 44px;
        padding: 0 18px;
        border: 0;
        border-radius: 6px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .continue-link {
        color: #ffffff;
        background: #16a34a;
      }

      .cancel-link {
        color: #1f2937;
        background: #e5e7eb;
      }

      @media (max-width: 480px) {
        main {
          padding: 24px;
        }

        .actions {
          flex-direction: column;
        }

        .button-link {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Vous allez etre redirige vers :</h1>
      <p class="url-box">${safeUrl}</p>
      <p class="warning">Verifiez que ce lien est sur avant de continuer.</p>
      <div class="actions">
        <a class="button-link continue-link" href="${continueHref}">Continuer</a>
        <a class="button-link cancel-link" href="/">Annuler</a>
      </div>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = {
  previewLink,
  redirectToOriginalUrl,
};

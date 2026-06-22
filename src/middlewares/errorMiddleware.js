const logger = require('../config/logger');

function errorMiddleware(error, req, res, next) {
  const statusCode = getStatusCode(error);
  const details = formatErrorDetails(error);

  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        details,
      },
      method: req.method,
      path: req.originalUrl,
      statusCode,
    },
    'Request failed',
  );

  res.status(statusCode).json({
    success: false,
    error: {
      message: getPublicMessage(error, statusCode),
      details,
    },
  });
}

function getStatusCode(error) {
  if (error.statusCode || error.status) {
    return error.statusCode || error.status;
  }

  if (error.name === 'ZodError' || error.code === 11000) {
    return 400;
  }

  return 500;
}

function getPublicMessage(error, statusCode) {
  if (error.name === 'ZodError') {
    return 'Validation failed';
  }

  if (error.code === 11000) {
    return 'Duplicate value';
  }

  return statusCode === 500 ? 'Internal server error' : error.message;
}

function formatErrorDetails(error) {
  if (error.details) {
    return error.details;
  }

  if (error.name === 'ZodError') {
    return error.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  if (error.code === 11000) {
    return {
      field: Object.keys(error.keyPattern || {})[0],
      message: 'Value already exists',
    };
  }

  return undefined;
}

module.exports = errorMiddleware;

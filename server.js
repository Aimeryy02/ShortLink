require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./src/config/database');
const logger = require('./src/config/logger');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(port, () => {
      logger.info({ port }, 'ShortLink server started');
    });
  } catch (error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      'Unable to start ShortLink server',
    );
    process.exit(1);
  }
}

startServer();

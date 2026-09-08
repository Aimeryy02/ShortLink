const mongoose = require('mongoose');
const logger = require('./logger');
const Click = require('../models/Click');
const { CLICK_RETENTION_DAYS } = require('./privacy');

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(mongoUri);
  await syncClickIndexes();
}

// Aligne les index de la collection des clics sur le schéma : supprime ceux qui
// n'y figurent plus (dont l'ancien index simple sur clickedAt) et crée l'index
// TTL qui porte la durée de conservation. Idempotent ; un échec est journalisé
// sans empêcher le service de démarrer.
async function syncClickIndexes() {
  try {
    const droppedIndexes = await Click.syncIndexes();

    logger.info(
      { droppedIndexes, retentionDays: CLICK_RETENTION_DAYS },
      'Click collection indexes synchronized',
    );
  } catch (error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      'Unable to synchronize click collection indexes',
    );
  }
}

module.exports = connectDatabase;

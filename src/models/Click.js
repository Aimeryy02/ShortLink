const mongoose = require('mongoose');

const { CLICK_RETENTION_DAYS } = require('../config/privacy');

// Un clic ne contient aucune donnée directement identifiante : ni adresse IP
// (même hachée), ni adresse complète de la page de provenance. Le pays est
// déduit de l'IP au moment du clic, puis l'IP est oubliée.
const clickSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
    },
    browser: {
      type: String,
      default: 'unknown',
    },
    os: {
      type: String,
      default: 'unknown',
    },
    device: {
      type: String,
      default: 'desktop',
    },
    country: {
      type: String,
      default: 'unknown',
      index: true,
    },
    refererDomain: {
      type: String,
      default: 'direct',
    },
    language: {
      type: String,
      default: 'unknown',
    },
  },
  {
    // Les index sont synchronisés explicitement au démarrage (config/database.js) :
    // l'index TTL ci-dessous remplace l'ancien index simple sur clickedAt, et
    // Mongoose ne peut pas résoudre ce conflit par la création automatique.
    autoIndex: false,
  },
);

// Durée de conservation : MongoDB supprime chaque clic une fois le délai écoulé.
clickSchema.index({ clickedAt: 1 }, { expireAfterSeconds: CLICK_RETENTION_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model('Click', clickSchema);

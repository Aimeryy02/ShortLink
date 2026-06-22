const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true,
    index: true,
  },
  clickedAt: {
    type: Date,
    default: Date.now,
    index: true,
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
  ip: {
    type: String,
    default: 'unknown',
  },
  country: {
    type: String,
    default: 'unknown',
    index: true,
  },
  referer: {
    type: String,
    default: 'direct',
  },
  refererDomain: {
    type: String,
    default: 'direct',
  },
  language: {
    type: String,
    default: 'unknown',
  },
});

module.exports = mongoose.model('Click', clickSchema);

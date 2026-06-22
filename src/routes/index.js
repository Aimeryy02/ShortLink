const express = require('express');

const linkRoutes = require('./linkRoutes');
const statsRoutes = require('./statsRoutes');
const qrRoutes = require('./qrRoutes');

const router = express.Router();

router.use('/api', linkRoutes);
router.use('/api/links', statsRoutes);
router.use('/api/qr', qrRoutes);

module.exports = router;

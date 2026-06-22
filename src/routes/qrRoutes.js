const express = require('express');
const { getQRCode } = require('../controllers/qrController');

const router = express.Router();

router.get('/:code', getQRCode);

module.exports = router;

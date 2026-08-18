const express = require('express');
const { getHealth, getReadinessStatus } = require('../controllers/healthController');

const router = express.Router();

router.get('/', getHealth);
router.get('/ready', getReadinessStatus);

module.exports = router;

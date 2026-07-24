const express = require('express');
const { getStats } = require('../controllers/statsController');
const { requireAdminKey } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

router.get('/:id/stats', requireAdminKey, getStats);

module.exports = router;

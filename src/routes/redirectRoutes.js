const express = require('express');
const { previewLink, redirectToOriginalUrl } = require('../controllers/redirectController');

const router = express.Router();

router.get(/^\/([^/]+)\+$/, previewLink);
router.get('/:code', redirectToOriginalUrl);

module.exports = router;

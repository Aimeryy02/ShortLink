const express = require('express');
const {
  getLink,
  getLinks,
  patchLink,
  removeLink,
  shortenLink,
} = require('../controllers/linkController');
const { requireAdminKey } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

router.post('/shorten', requireAdminKey, shortenLink);
router.get('/links', requireAdminKey, getLinks);
router.get('/links/:id', requireAdminKey, getLink);
router.patch('/links/:id', requireAdminKey, patchLink);
router.delete('/links/:id', requireAdminKey, removeLink);

module.exports = router;

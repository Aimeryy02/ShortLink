const express = require('express');
const {
  getLink,
  getLinks,
  patchLink,
  removeLink,
  shortenLink,
} = require('../controllers/linkController');

const router = express.Router();

router.post('/shorten', shortenLink);
router.get('/links', getLinks);
router.get('/links/:id', getLink);
router.patch('/links/:id', patchLink);
router.delete('/links/:id', removeLink);

module.exports = router;

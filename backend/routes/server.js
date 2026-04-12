const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getServers, addServer, updateServerStatus } = require('../controllers/serverController');

router.get('/', getServers);
router.post('/', auth, addServer);
router.put('/:id', auth, updateServerStatus);

module.exports = router;

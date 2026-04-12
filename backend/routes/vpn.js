const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createVpnClient, getClientConfig, downloadConfig } = require('../controllers/vpnController');

router.post('/create', auth, createVpnClient);
router.get('/config', auth, getClientConfig);
router.get('/download', auth, downloadConfig);

module.exports = router;

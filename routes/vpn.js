const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createVpnClient, getClientConfig, downloadConfig } = require('../controllers/vpnController');

// @route    POST api/vpn/create
// @desc     Create VPN client config
// @access   Private
router.post('/create', auth, createVpnClient);

// @route    GET api/vpn/config
// @desc     Get current VPN config as text
// @access   Private
router.get('/config', auth, getClientConfig);

// @route    GET api/vpn/download
// @desc     Download .conf file
// @access   Private
router.get('/download', auth, downloadConfig);

module.exports = router;

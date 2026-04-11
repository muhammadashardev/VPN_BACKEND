const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getServers, addServer } = require('../controllers/serverController');

// @route    GET api/servers
// @desc     Get all available VPN servers
// @access   Private (or Public depending on UI design)
router.get('/', auth, getServers);

// @route    POST api/servers
// @desc     Add a new VPN server (Admin only in production)
// @access   Private
router.post('/', auth, addServer);

module.exports = router;

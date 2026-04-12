const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    connect,
    disconnect,
    getStatus,
    getLastConnection,
    reconnect,
    setAutoReconnect
} = require('../controllers/connectionController');

// POST /api/connection/connect - Connect to a server
router.post('/connect', auth, connect);

// POST /api/connection/disconnect - Disconnect from VPN
router.post('/disconnect', auth, disconnect);

// GET /api/connection/status - Get current connection status
router.get('/status', auth, getStatus);

// GET /api/connection/last - Get last connection for auto-reconnect
router.get('/last', auth, getLastConnection);

// POST /api/connection/reconnect - Reconnect to last server
router.post('/reconnect', auth, reconnect);

// PUT /api/connection/auto-reconnect - Toggle auto-reconnect
router.put('/auto-reconnect', auth, setAutoReconnect);

module.exports = router;

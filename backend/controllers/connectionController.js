const Connection = require('../models/Connection');
const Server = require('../models/Server');
const User = require('../models/User');

// Connect to a VPN server (WireGuard or Proxy)
const connect = async (req, res) => {
    const { serverId, type = 'proxy' } = req.body;
    try {
        const server = await Server.findById(serverId);
        if (!server) return res.status(404).json({ msg: 'Server not found' });
        if (server.status !== 'active') return res.status(400).json({ msg: 'Server is not available' });

        // Disconnect any existing connection of this type
        await Connection.updateMany(
            { userId: req.user.id, type, status: 'active' },
            { status: 'disconnected', disconnectedAt: new Date() }
        );

        // Create new connection
        const connection = new Connection({
            userId: req.user.id,
            serverId: server._id,
            type,
            status: 'active',
            serverIp: server.ip,
            country: server.country,
            countryCode: server.countryCode,
            city: server.city,
            autoReconnect: true,
            lastSelectedServerId: server._id
        });
        await connection.save();

        // Update server connection count
        await Server.findByIdAndUpdate(serverId, { $inc: { activeConnections: 1 } });

        // Save user's last location for auto-reconnect
        await User.findByIdAndUpdate(req.user.id, {
            lastLocation: {
                country: server.country,
                countryCode: server.countryCode,
                city: server.city,
                serverId: server._id.toString()
            }
        });

        // Build proxy config for Chrome extension
        const proxyConfig = type === 'proxy' ? {
            host: server.proxyHost || server.ip,
            port: server.proxyPort || 8080,
            type: server.proxyType || 'http',
            username: server.proxyUsername,
            password: server.proxyPassword
        } : null;

        res.json({
            connection: {
                id: connection._id,
                status: connection.status,
                type: connection.type,
                server: {
                    id: server._id,
                    country: server.country,
                    countryCode: server.countryCode,
                    city: server.city,
                    ip: server.ip,
                    flag: server.flag,
                    lat: server.lat,
                    lng: server.lng
                },
                proxyConfig,
                connectedAt: connection.connectedAt,
                autoReconnect: connection.autoReconnect
            }
        });
    } catch (err) {
        console.error('Connection Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Disconnect from VPN
const disconnect = async (req, res) => {
    const { type = 'proxy' } = req.body;
    try {
        const connection = await Connection.findOneAndUpdate(
            { userId: req.user.id, type, status: 'active' },
            { status: 'disconnected', disconnectedAt: new Date() },
            { returnDocument: 'after' }
        );

        if (connection) {
            await Server.findByIdAndUpdate(connection.serverId, {
                $inc: { activeConnections: -1 }
            });
        }

        res.json({ msg: 'Disconnected', connection });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get current connection status
const getStatus = async (req, res) => {
    try {
        const connection = await Connection.findOne({
            userId: req.user.id,
            status: 'active'
        }).populate('serverId', 'country countryCode city ip flag lat lng proxyHost proxyPort proxyType');

        if (!connection) {
            return res.json({ connected: false, connection: null });
        }

        res.json({
            connected: true,
            connection: {
                id: connection._id,
                type: connection.type,
                status: connection.status,
                server: connection.serverId,
                connectedAt: connection.connectedAt,
                autoReconnect: connection.autoReconnect
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get last connection for auto-reconnect
const getLastConnection = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.lastLocation || !user.lastLocation.serverId) {
            return res.json({ hasLastConnection: false });
        }

        const server = await Server.findById(user.lastLocation.serverId)
            .select('-proxyUsername -proxyPassword');

        if (!server || server.status !== 'active') {
            return res.json({ hasLastConnection: false });
        }

        res.json({
            hasLastConnection: true,
            autoReconnect: user.autoReconnect,
            lastServer: {
                id: server._id,
                country: server.country,
                countryCode: server.countryCode,
                city: server.city,
                ip: server.ip,
                flag: server.flag,
                lat: server.lat,
                lng: server.lng
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Reconnect to last server (called after network recovery)
const reconnect = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.lastLocation || !user.lastLocation.serverId) {
            return res.status(400).json({ msg: 'No previous connection to restore' });
        }

        if (!user.autoReconnect) {
            return res.status(400).json({ msg: 'Auto-reconnect is disabled' });
        }

        // Simulate a connect request to the last server
        req.body = {
            serverId: user.lastLocation.serverId,
            type: req.body.type || 'proxy'
        };

        return connect(req, res);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Update auto-reconnect preference
const setAutoReconnect = async (req, res) => {
    const { enabled } = req.body;
    try {
        await User.findByIdAndUpdate(req.user.id, { autoReconnect: enabled });

        // Also update active connection
        await Connection.updateMany(
            { userId: req.user.id, status: 'active' },
            { autoReconnect: enabled }
        );

        res.json({ autoReconnect: enabled });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = { connect, disconnect, getStatus, getLastConnection, reconnect, setAutoReconnect };

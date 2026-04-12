const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'server',
        required: true
    },
    // Connection type: 'wireguard' for full VPN, 'proxy' for Chrome extension
    type: {
        type: String,
        enum: ['wireguard', 'proxy'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'disconnected', 'reconnecting'],
        default: 'active'
    },
    clientIp: String,
    serverIp: String,
    country: String,
    countryCode: String,
    city: String,
    // Auto-reconnect settings
    autoReconnect: {
        type: Boolean,
        default: true
    },
    lastSelectedServerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'server'
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    disconnectedAt: Date,
    bytesUp: { type: Number, default: 0 },
    bytesDown: { type: Number, default: 0 }
});

// Only one active connection per user per type
ConnectionSchema.index({ userId: 1, type: 1, status: 1 });

module.exports = mongoose.model('connection', ConnectionSchema);

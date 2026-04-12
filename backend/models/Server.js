const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        default: 'Main Gateway'
    },
    ip: {
        type: String,
        required: true,
        unique: true
    },
    publicKey: {
        type: String,
        required: true
    },
    // Proxy server details for Chrome extension
    proxyHost: {
        type: String
    },
    proxyPort: {
        type: Number,
        default: 8080
    },
    proxyType: {
        type: String,
        enum: ['http', 'https', 'socks5'],
        default: 'http'
    },
    proxyUsername: String,
    proxyPassword: String,
    lat: Number,
    lng: Number,
    flag: String,
    status: {
        type: String,
        enum: ['active', 'maintenance', 'offline'],
        default: 'active'
    },
    load: {
        type: Number,
        default: 0
    },
    maxConnections: {
        type: Number,
        default: 100
    },
    activeConnections: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('server', ServerSchema);

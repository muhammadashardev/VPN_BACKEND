const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
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
    status: {
        type: String,
        default: 'active'
    }
});

module.exports = mongoose.model('server', ServerSchema);

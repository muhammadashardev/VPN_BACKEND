require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initVPN = require('./utils/initVpn');

const app = express();

// Connect Database
connectDB();

// Initialize VPN Interface
initVPN();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'chrome-extension://*'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/location', require('./routes/location'));
app.use('/api/vpn', require('./routes/vpn'));
app.use('/api/servers', require('./routes/server'));
app.use('/api/connection', require('./routes/connection'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`VPN Backend running on port ${PORT}`));

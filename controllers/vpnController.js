const VPNClient = require('../models/VPNClient');
const Server = require('../models/Server');
const { 
    generateKeys, 
    generateConfig, 
    addPeerToConfig, 
    addPeerLive,
    isInterfaceUp 
} = require('../utils/wgTools');

/**
 * Robust IP Allocation Logic
 * Finds first available IP in 10.0.0.2 - 10.0.0.254 range
 */
const getAvailableIP = async (serverIP) => {
    const clients = await VPNClient.find({ serverIP }).select('assignedIP');
    const usedIPs = new Set(clients.map(c => c.assignedIP));
    
    // Start from 10.0.0.2 (10.0.0.1 is usually the server)
    for (let i = 2; i <= 254; i++) {
        const potentialIP = `10.0.0.${i}`;
        if (!usedIPs.has(potentialIP)) {
            return potentialIP;
        }
    }
    throw new Error('No available IPs in the pool');
};

const createVpnClient = async (req, res) => {
    const { country, serverIP } = req.body;
    try {
        // 1. Find server
        const server = await Server.findOne({ ip: serverIP });
        if (!server) return res.status(404).json({ msg: 'Server not found' });

        // 2. Check if client already exists for this server
        let client = await VPNClient.findOne({ userId: req.user.id, serverIP });
        
        if (client) {
            return res.json(client);
        }

        // 3. Generate Keys (with fallback for dev)
        let keys;
        try {
            keys = await generateKeys();
        } catch (err) {
            console.warn('WireGuard tools not found. Using mock keys for development.');
            keys = { 
                privateKey: 'MOCK_PRIVATE_KEY_' + Math.random().toString(36).substring(7), 
                publicKey: 'MOCK_PUBLIC_KEY_' + Math.random().toString(36).substring(7) 
            };
        }

        // 4. Robust IP Assignment
        const newIP = await getAvailableIP(serverIP);

        // 5. Save to DB
        client = new VPNClient({
            userId: req.user.id,
            privateKey: keys.privateKey,
            publicKey: keys.publicKey,
            assignedIP: newIP,
            serverIP: server.ip,
            country
        });

        await client.save();

        // 6. Production Integration: Live Update & Persistence
        const interfaceUp = await isInterfaceUp();
        
        try {
            // Persist to config file
            addPeerToConfig(keys.publicKey, newIP);
            
            // Add peer to interface in real-time if interface is up
            if (interfaceUp) {
                await addPeerLive(keys.publicKey, newIP);
            } else {
                console.warn('WireGuard interface is DOWN. Peer added to config but not live interface.');
            }
        } catch (err) {
            console.error('Failed to update WireGuard server state:', err.message);
            // We still return the client config so the user can download it
        }

        res.json(client);
    } catch (err) {
        console.error('VPN Creation Error:', err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

const getClientConfig = async (req, res) => {
    try {
        const client = await VPNClient.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!client) return res.status(404).json({ msg: 'No VPN configuration found' });

        const server = await Server.findOne({ ip: client.serverIP });
        if (!server) return res.status(404).json({ msg: 'Server associated with config not found' });

        const config = generateConfig(client, server);
        res.type('text/plain').send(config);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const downloadConfig = async (req, res) => {
    try {
        const client = await VPNClient.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!client) return res.status(404).json({ msg: 'No VPN configuration found' });

        const server = await Server.findOne({ ip: client.serverIP });
        const config = generateConfig(client, server);

        res.set({
            'Content-Disposition': `attachment; filename="wg0_${client.country}.conf"`,
            'Content-Type': 'application/octet-stream',
        });
        res.send(config);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createVpnClient,
    getClientConfig,
    downloadConfig
};

const VPNClient = require('../models/VPNClient');
const Server = require('../models/Server');
const { generateKeys, generateConfig, addPeerToConfig, addPeerLive, isInterfaceUp } = require('../utils/wgTools');

const getAvailableIP = async (serverIP) => {
    const clients = await VPNClient.find({ serverIP }).select('assignedIP');
    const usedIPs = new Set(clients.map(c => c.assignedIP));
    for (let i = 2; i <= 254; i++) {
        const potentialIP = `10.0.0.${i}`;
        if (!usedIPs.has(potentialIP)) return potentialIP;
    }
    throw new Error('No available IPs in the pool');
};

const createVpnClient = async (req, res) => {
    const { country, serverIP } = req.body;
    try {
        const server = await Server.findOne({ ip: serverIP });
        if (!server) return res.status(404).json({ msg: 'Server not found' });

        let client = await VPNClient.findOne({ userId: req.user.id, serverIP });
        if (client) return res.json(client);

        let keys;
        try {
            keys = await generateKeys();
        } catch (err) {
            keys = {
                privateKey: 'DEV_PRIVATE_' + Math.random().toString(36).substring(7),
                publicKey: 'DEV_PUBLIC_' + Math.random().toString(36).substring(7)
            };
        }

        const newIP = await getAvailableIP(serverIP);

        client = new VPNClient({
            userId: req.user.id,
            privateKey: keys.privateKey,
            publicKey: keys.publicKey,
            assignedIP: newIP,
            serverIP: server.ip,
            country
        });
        await client.save();

        try {
            addPeerToConfig(keys.publicKey, newIP);
            if (await isInterfaceUp()) {
                await addPeerLive(keys.publicKey, newIP);
            }
        } catch (err) {
            console.error('WireGuard update failed:', err.message);
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
        if (!server) return res.status(404).json({ msg: 'Server not found' });

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

module.exports = { createVpnClient, getClientConfig, downloadConfig };

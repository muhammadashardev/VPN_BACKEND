const { exec } = require('child_process');
const fs = require('fs');

const generateKeys = () => {
    return new Promise((resolve, reject) => {
        exec('wg genkey', (err, privateKey) => {
            if (err) return reject(err);
            const priv = privateKey.trim();
            exec(`echo ${priv} | wg pubkey`, (err, publicKey) => {
                if (err) return reject(err);
                resolve({ privateKey: priv, publicKey: publicKey.trim() });
            });
        });
    });
};

const generateConfig = (client, server) => {
    return `[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.assignedIP}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${server.publicKey}
Endpoint = ${server.ip}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;
};

const addPeerToConfig = (clientPublicKey, clientIP) => {
    const configPath = process.env.WG_CONFIG_PATH || '/etc/wireguard/wg0.conf';
    try {
        if (fs.existsSync(configPath)) {
            const currentConfig = fs.readFileSync(configPath, 'utf8');
            if (currentConfig.includes(clientPublicKey)) return true;
        }
        const newPeer = `\n# Client: ${clientIP}\n[Peer]\nPublicKey = ${clientPublicKey}\nAllowedIPs = ${clientIP}/32\n`;
        fs.appendFileSync(configPath, newPeer);
        return true;
    } catch (error) {
        console.error('Error adding peer to WG config:', error.message);
        throw error;
    }
};

const addPeerLive = (clientPublicKey, clientIP) => {
    return new Promise((resolve, reject) => {
        const iface = process.env.WG_INTERFACE || 'wg0';
        exec(`sudo wg set ${iface} peer ${clientPublicKey} allowed-ips ${clientIP}/32`, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
};

const isInterfaceUp = () => {
    return new Promise((resolve) => {
        const iface = process.env.WG_INTERFACE || 'wg0';
        exec(`wg show ${iface}`, (err) => resolve(!err));
    });
};

const restartWireGuard = () => {
    return new Promise((resolve, reject) => {
        const iface = process.env.WG_INTERFACE || 'wg0';
        exec(`sudo wg-quick down ${iface} && sudo wg-quick up ${iface}`, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
};

module.exports = { generateKeys, generateConfig, addPeerToConfig, addPeerLive, isInterfaceUp, restartWireGuard };

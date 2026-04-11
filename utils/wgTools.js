const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate WireGuard private and public keys
 */
const generateKeys = () => {
    return new Promise((resolve, reject) => {
        // Using -n to avoid newline in output
        exec('wg genkey', (err, privateKey) => {
            if (err) {
                console.error('Error in wg genkey:', err.message);
                return reject(err);
            }
            const priv = privateKey.trim();
            exec(`echo ${priv} | wg pubkey`, (err, publicKey) => {
                if (err) {
                    console.error('Error in wg pubkey:', err.message);
                    return reject(err);
                }
                resolve({
                    privateKey: priv,
                    publicKey: publicKey.trim()
                });
            });
        });
    });
};

/**
 * Generate client configuration file content
 */
const generateConfig = (client, server) => {
    return `
[Interface]
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

/**
 * Persistently add a peer to the wg0.conf file
 */
const addPeerToConfig = (clientPublicKey, clientIP) => {
    const configPath = process.env.WG_CONFIG_PATH || '/etc/wireguard/wg0.conf';
    
    try {
        // Check if file exists
        if (!fs.existsSync(configPath)) {
            console.warn(`Warning: Config file not found at ${configPath}. Creating a new one may be dangerous.`);
        } else {
            const currentConfig = fs.readFileSync(configPath, 'utf8');
            if (currentConfig.includes(clientPublicKey)) {
                console.log('Peer already exists in config file. Skipping append.');
                return true;
            }
        }

        const newPeer = `\n# Client: ${clientIP}\n[Peer]\nPublicKey = ${clientPublicKey}\nAllowedIPs = ${clientIP}/32\n`;
        fs.appendFileSync(configPath, newPeer);
        return true;
    } catch (error) {
        console.error('Error adding peer to WG config:', error.message);
        throw error;
    }
};

/**
 * Add a peer to the LIVE running interface without restarting
 */
const addPeerLive = (clientPublicKey, clientIP) => {
    return new Promise((resolve, reject) => {
        const setInterface = process.env.WG_INTERFACE || 'wg0';
        const command = `sudo wg set ${setInterface} peer ${clientPublicKey} allowed-ips ${clientIP}/32`;
        
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error('Error adding peer live:', stderr);
                return reject(err);
            }
            console.log(`Successfully added peer ${clientPublicKey} to interface ${setInterface}`);
            resolve(stdout);
        });
    });
};

/**
 * Check if the VPN interface is currently up
 */
const isInterfaceUp = () => {
    return new Promise((resolve) => {
        const setInterface = process.env.WG_INTERFACE || 'wg0';
        exec(`wg show ${setInterface}`, (err) => {
            resolve(!err);
        });
    });
};

/**
 * Restart the interface (Fall back mechanism)
 */
const restartWireGuard = () => {
    return new Promise((resolve, reject) => {
        const setInterface = process.env.WG_INTERFACE || 'wg0';
        exec(`sudo wg-quick down ${setInterface} && sudo wg-quick up ${setInterface}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error restarting WireGuard:', stderr);
                return reject(err);
            }
            resolve(stdout);
        });
    });
};

module.exports = {
    generateKeys,
    generateConfig,
    addPeerToConfig,
    addPeerLive,
    isInterfaceUp,
    restartWireGuard
};

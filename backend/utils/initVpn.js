const os = require('os');

const initVPNInterface = async () => {
    const platform = os.platform();

    if (platform === 'win32') {
        console.log('Windows detected - WireGuard managed via WireGuard GUI/Service');
        console.log('Running in proxy-only mode for Chrome extension');
        return;
    }

    // Linux/Mac: try to bring up WireGuard interface
    const { exec } = require('child_process');
    const { isInterfaceUp } = require('./wgTools');
    const iface = process.env.WG_INTERFACE || 'wg0';

    const interfaceUp = await isInterfaceUp();
    if (!interfaceUp) {
        console.log(`Interface ${iface} is down. Attempting to bring it up...`);
        exec(`sudo wg-quick up ${iface}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Failed to bring up ${iface}:`, stderr);
                console.warn('WireGuard not available - running in proxy-only mode');
                return;
            }
            console.log(`Interface ${iface} is now UP.`);
        });
    } else {
        console.log(`Interface ${iface} is already active.`);
    }
};

module.exports = initVPNInterface;

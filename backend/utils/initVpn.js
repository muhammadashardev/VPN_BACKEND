const { exec } = require('child_process');
const { isInterfaceUp } = require('./wgTools');

const initVPNInterface = async () => {
    const interfaceUp = await isInterfaceUp();
    const iface = process.env.WG_INTERFACE || 'wg0';

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

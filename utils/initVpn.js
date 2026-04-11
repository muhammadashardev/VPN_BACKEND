const { exec } = require('child_process');
const { isInterfaceUp } = require('./wgTools');

/**
 * Initialize the VPN interface on server startup
 */
const initVPNInterface = async () => {
    const interfaceUp = await isInterfaceUp();
    const setInterface = process.env.WG_INTERFACE || 'wg0';

    if (!interfaceUp) {
        console.log(`Interface ${setInterface} is down. Attempting to bring it up...`);
        exec(`sudo wg-quick up ${setInterface}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Failed to bring up ${setInterface}:`, stderr);
                console.warn('Note: Ensure WireGuard is installed and you have root privileges.');
                return;
            }
            console.log(`Interface ${setInterface} is now UP.`);
        });
    } else {
        console.log(`Interface ${setInterface} is already active.`);
    }
};

module.exports = initVPNInterface;

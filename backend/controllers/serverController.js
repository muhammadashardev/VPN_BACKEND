const Server = require('../models/Server');

const getServers = async (req, res) => {
    try {
        const servers = await Server.find({ status: 'active' })
            .select('-proxyUsername -proxyPassword')
            .sort({ country: 1 });
        res.json(servers);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const addServer = async (req, res) => {
    const { country, countryCode, city, ip, publicKey, proxyHost, proxyPort, proxyType, proxyUsername, proxyPassword, lat, lng, flag } = req.body;
    try {
        let server = new Server({
            country, countryCode, city, ip, publicKey,
            proxyHost, proxyPort, proxyType, proxyUsername, proxyPassword,
            lat, lng, flag
        });
        await server.save();
        res.json(server);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateServerStatus = async (req, res) => {
    const { status, load } = req.body;
    try {
        const server = await Server.findByIdAndUpdate(
            req.params.id,
            { status, load },
            { new: true }
        );
        if (!server) return res.status(404).json({ msg: 'Server not found' });
        res.json(server);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

module.exports = { getServers, addServer, updateServerStatus };

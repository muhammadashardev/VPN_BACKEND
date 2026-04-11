const Server = require('../models/Server');

const getServers = async (req, res) => {
    try {
        const servers = await Server.find();
        res.json(servers);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const addServer = async (req, res) => {
    const { country, ip, publicKey } = req.body;
    try {
        let server = new Server({ country, ip, publicKey });
        await server.save();
        res.json(server);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getServers,
    addServer
};

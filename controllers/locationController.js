const { getCountries, getStates, getCities } = require('../utils/externalApis');
const User = require('../models/User');

const fetchCountries = async (req, res) => {
    try {
        const countries = await getCountries();
        res.json(countries);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching countries' });
    }
};

const fetchStates = async (req, res) => {
    try {
        const states = await getStates(req.query.country);
        res.json(states);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching states' });
    }
};

const fetchCities = async (req, res) => {
    try {
        const cities = await getCities(req.query.country, req.query.state);
        res.json(cities);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching cities' });
    }
};

const saveLocation = async (req, res) => {
    const { country, state, city } = req.body;
    try {
        const user = await User.findById(req.user.id);
        user.lastLocation = { country, state, city };
        await user.save();
        res.json(user.lastLocation);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const getLastLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.lastLocation || {});
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

module.exports = {
    fetchCountries,
    fetchStates,
    fetchCities,
    saveLocation,
    getLastLocation
};

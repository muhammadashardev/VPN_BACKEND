const axios = require('axios');

const GEODB_BASE_URL = 'http://geodb-free-service.wirefreethought.com/v1/geo';
const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all';

const getCountries = async () => {
    try {
        const response = await axios.get(REST_COUNTRIES_URL);
        return response.data.map(country => ({
            name: country.name.common,
            code: country.cca2,
            flag: country.flags.png
        })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error fetching countries:', error.message);
        throw error;
    }
};

const getStates = async (countryCode) => {
    try {
        const response = await axios.get(`${GEODB_BASE_URL}/countries/${countryCode}/regions`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching states:', error.message);
        throw error;
    }
};

const getCities = async (countryCode, regionCode) => {
    try {
        const response = await axios.get(`${GEODB_BASE_URL}/countries/${countryCode}/regions/${regionCode}/cities`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching cities:', error.message);
        throw error;
    }
};

module.exports = {
    getCountries,
    getStates,
    getCities
};

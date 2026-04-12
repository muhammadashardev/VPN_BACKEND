const axios = require('axios');

const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all';
const GEODB_BASE_URL = 'http://geodb-free-service.wirefreethought.com/v1/geo';

const getCountries = async () => {
    const response = await axios.get(REST_COUNTRIES_URL);
    return response.data.map(country => ({
        name: country.name.common,
        code: country.cca2,
        flag: country.flags.png
    })).sort((a, b) => a.name.localeCompare(b.name));
};

const getStates = async (countryCode) => {
    const response = await axios.get(`${GEODB_BASE_URL}/countries/${countryCode}/regions`);
    return response.data.data;
};

const getCities = async (countryCode, regionCode) => {
    const response = await axios.get(`${GEODB_BASE_URL}/countries/${countryCode}/regions/${regionCode}/cities`);
    return response.data.data;
};

module.exports = { getCountries, getStates, getCities };

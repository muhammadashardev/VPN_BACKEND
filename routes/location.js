const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchCountries, fetchStates, fetchCities, saveLocation, getLastLocation } = require('../controllers/locationController');

// @route    GET api/location/countries
// @desc     Get all countries
// @access   Private
router.get('/countries', auth, fetchCountries);

// @route    GET api/location/states
// @desc     Get states by country
// @access   Private
router.get('/states', auth, fetchStates);

// @route    GET api/location/cities
// @desc     Get cities by state
// @access   Private
router.get('/cities', auth, fetchCities);

// @route    POST api/location/save
// @desc     Save user's last location
// @access   Private
router.post('/save', auth, saveLocation);

// @route    GET api/location/last
// @desc     Get user's last location
// @access   Private
router.get('/last', auth, getLastLocation);

module.exports = router;

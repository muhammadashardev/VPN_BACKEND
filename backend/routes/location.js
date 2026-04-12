const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchCountries, fetchStates, fetchCities, saveLocation, getLastLocation } = require('../controllers/locationController');

router.get('/countries', auth, fetchCountries);
router.get('/states', auth, fetchStates);
router.get('/cities', auth, fetchCities);
router.post('/save', auth, saveLocation);
router.get('/last', auth, getLastLocation);

module.exports = router;

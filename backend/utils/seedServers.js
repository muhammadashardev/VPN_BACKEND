/**
 * Seed script to populate VPN servers in the database.
 * Run: node utils/seedServers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Server = require('../models/Server');

const servers = [
  { country: 'United States', countryCode: 'US', city: 'New York', ip: '198.51.100.1', publicKey: 'US_WG_PUBLIC_KEY_NY', proxyHost: '198.51.100.1', proxyPort: 8080, proxyType: 'http', lat: 40.7128, lng: -74.006, flag: '🇺🇸' },
  { country: 'United States', countryCode: 'US', city: 'Los Angeles', ip: '198.51.100.2', publicKey: 'US_WG_PUBLIC_KEY_LA', proxyHost: '198.51.100.2', proxyPort: 8080, proxyType: 'http', lat: 34.0522, lng: -118.2437, flag: '🇺🇸' },
  { country: 'United Kingdom', countryCode: 'GB', city: 'London', ip: '203.0.113.1', publicKey: 'GB_WG_PUBLIC_KEY', proxyHost: '203.0.113.1', proxyPort: 8080, proxyType: 'http', lat: 51.5074, lng: -0.1278, flag: '🇬🇧' },
  { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', ip: '203.0.113.2', publicKey: 'DE_WG_PUBLIC_KEY', proxyHost: '203.0.113.2', proxyPort: 8080, proxyType: 'http', lat: 50.1109, lng: 8.6821, flag: '🇩🇪' },
  { country: 'Japan', countryCode: 'JP', city: 'Tokyo', ip: '203.0.113.3', publicKey: 'JP_WG_PUBLIC_KEY', proxyHost: '203.0.113.3', proxyPort: 8080, proxyType: 'http', lat: 35.6762, lng: 139.6503, flag: '🇯🇵' },
  { country: 'Pakistan', countryCode: 'PK', city: 'Islamabad', ip: '203.0.113.4', publicKey: 'PK_WG_PUBLIC_KEY', proxyHost: '203.0.113.4', proxyPort: 8080, proxyType: 'http', lat: 33.6844, lng: 73.0479, flag: '🇵🇰' },
  { country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai', ip: '203.0.113.5', publicKey: 'AE_WG_PUBLIC_KEY', proxyHost: '203.0.113.5', proxyPort: 8080, proxyType: 'http', lat: 25.2048, lng: 55.2708, flag: '🇦🇪' },
  { country: 'Canada', countryCode: 'CA', city: 'Toronto', ip: '203.0.113.6', publicKey: 'CA_WG_PUBLIC_KEY', proxyHost: '203.0.113.6', proxyPort: 8080, proxyType: 'http', lat: 43.6532, lng: -79.3832, flag: '🇨🇦' },
  { country: 'France', countryCode: 'FR', city: 'Paris', ip: '203.0.113.7', publicKey: 'FR_WG_PUBLIC_KEY', proxyHost: '203.0.113.7', proxyPort: 8080, proxyType: 'http', lat: 48.8566, lng: 2.3522, flag: '🇫🇷' },
  { country: 'Australia', countryCode: 'AU', city: 'Sydney', ip: '203.0.113.8', publicKey: 'AU_WG_PUBLIC_KEY', proxyHost: '203.0.113.8', proxyPort: 8080, proxyType: 'http', lat: -33.8688, lng: 151.2093, flag: '🇦🇺' },
  { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', ip: '203.0.113.9', publicKey: 'NL_WG_PUBLIC_KEY', proxyHost: '203.0.113.9', proxyPort: 8080, proxyType: 'http', lat: 52.3676, lng: 4.9041, flag: '🇳🇱' },
  { country: 'Singapore', countryCode: 'SG', city: 'Singapore', ip: '203.0.113.10', publicKey: 'SG_WG_PUBLIC_KEY', proxyHost: '203.0.113.10', proxyPort: 8080, proxyType: 'http', lat: 1.3521, lng: 103.8198, flag: '🇸🇬' },
  { country: 'India', countryCode: 'IN', city: 'Mumbai', ip: '203.0.113.11', publicKey: 'IN_WG_PUBLIC_KEY', proxyHost: '203.0.113.11', proxyPort: 8080, proxyType: 'http', lat: 19.076, lng: 72.8777, flag: '🇮🇳' },
  { country: 'South Korea', countryCode: 'KR', city: 'Seoul', ip: '203.0.113.12', publicKey: 'KR_WG_PUBLIC_KEY', proxyHost: '203.0.113.12', proxyPort: 8080, proxyType: 'http', lat: 37.5665, lng: 126.978, flag: '🇰🇷' },
  { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', ip: '203.0.113.13', publicKey: 'BR_WG_PUBLIC_KEY', proxyHost: '203.0.113.13', proxyPort: 8080, proxyType: 'http', lat: -23.5505, lng: -46.6333, flag: '🇧🇷' },
  { country: 'Turkey', countryCode: 'TR', city: 'Istanbul', ip: '203.0.113.14', publicKey: 'TR_WG_PUBLIC_KEY', proxyHost: '203.0.113.14', proxyPort: 8080, proxyType: 'http', lat: 41.0082, lng: 28.9784, flag: '🇹🇷' },
  { country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh', ip: '203.0.113.15', publicKey: 'SA_WG_PUBLIC_KEY', proxyHost: '203.0.113.15', proxyPort: 8080, proxyType: 'http', lat: 24.7136, lng: 46.6753, flag: '🇸🇦' },
  { country: 'Sweden', countryCode: 'SE', city: 'Stockholm', ip: '203.0.113.16', publicKey: 'SE_WG_PUBLIC_KEY', proxyHost: '203.0.113.16', proxyPort: 8080, proxyType: 'http', lat: 59.3293, lng: 18.0686, flag: '🇸🇪' },
  { country: 'Switzerland', countryCode: 'CH', city: 'Zurich', ip: '203.0.113.17', publicKey: 'CH_WG_PUBLIC_KEY', proxyHost: '203.0.113.17', proxyPort: 8080, proxyType: 'http', lat: 47.3769, lng: 8.5417, flag: '🇨🇭' },
  { country: 'Italy', countryCode: 'IT', city: 'Milan', ip: '203.0.113.18', publicKey: 'IT_WG_PUBLIC_KEY', proxyHost: '203.0.113.18', proxyPort: 8080, proxyType: 'http', lat: 45.4642, lng: 9.1900, flag: '🇮🇹' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing servers
  await Server.deleteMany({});
  console.log('Cleared existing servers');

  // Insert new servers
  await Server.insertMany(servers);
  console.log(`Seeded ${servers.length} VPN servers`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

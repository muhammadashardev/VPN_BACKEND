import countriesData from "./data/countries.json";

export type VpnServer = {
  id: string;
  country: string;
  city: string;
  ip: string;
  lat: number;
  lng: number;
  flag: string;
  load: number;
  latency: number;
};

// Map raw country data to VpnServer format
export const VPN_SERVERS: VpnServer[] = countriesData.map((country: any) => {
  // Generate a realistic but safe IP based on country code
  const hash = country.code.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const ip = `${100 + (hash % 150)}.${50 + (hash % 150)}.${20 + (hash % 200)}.${hash % 255}`;
  
  return {
    id: country.code.toLowerCase(),
    country: country.name,
    city: country.capital || "Main Gateway",
    ip: ip,
    lat: country.latling[0],
    lng: country.latling[1],
    flag: country.flag,
    load: 10 + (hash % 80),
    latency: 20 + (hash % 200),
  };
});

// Sort by country name for better UX
VPN_SERVERS.sort((a, b) => a.country.localeCompare(b.country));

export const FEATURED_SERVERS = VPN_SERVERS.filter(s => 
  ["US", "GB", "DE", "JP", "PK", "AE", "CA", "FR", "AU"].includes(s.id.toUpperCase())
);

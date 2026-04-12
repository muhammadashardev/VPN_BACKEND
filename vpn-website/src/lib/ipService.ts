export interface GeoIpData {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string; // lat,lng
  org: string;
  postal: string;
  timezone: string;
}

export const fetchGeoIpData = async (): Promise<GeoIpData> => {
  try {
    const response = await fetch("https://ipinfo.io/json");
    if (!response.ok) throw new Error("Failed to fetch Geolocation data");
    return await response.json();
  } catch (error) {
    console.error("IP Service Error:", error);
    throw error;
  }
};

export const getPublicIp = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return "0.0.0.0";
  }
};

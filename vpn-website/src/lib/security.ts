/**
 * Tests for WebRTC leaks by checking if internal local network IPs are exposed.
 */
export const checkWebRtcLeak = (): Promise<{
  isLeaking: boolean;
  leakedIps: string[];
}> => {
  return new Promise((resolve) => {
    const leakedIps: string[] = [];
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("");
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((err) => console.error("WebRTC Error:", err));

    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) {
        pc.close();
        resolve({
          isLeaking: leakedIps.length > 0,
          leakedIps,
        });
        return;
      }

      const candidate = ice.candidate.candidate;
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
      const match = ipRegex.exec(candidate);
      if (match) {
        const ip = match[1];
        // Check if it's a private/local IP (192.168.x.x, 10.x.x.x, 172.16.x.x)
        if (
          ip.startsWith("192.168.") ||
          ip.startsWith("10.") ||
          ip.startsWith("172.16.")
        ) {
          if (!leakedIps.includes(ip)) {
            leakedIps.push(ip);
          }
        }
      }
    };

    // Timeout after 400ms if no candidates found - ultra-fast discovery
    // Most local candidates are discovered in <100ms
    setTimeout(() => {
      if (pc.signalingState !== "closed") {
        pc.close();
        resolve({
          isLeaking: leakedIps.length > 0,
          leakedIps,
        });
      }
    }, 400);
  });
};

/**
 * Spoofs browser location with provided coordinates.
 */
export const spoofLocation = (lat: number, lng: number) => {
  if (typeof window !== "undefined" && navigator.geolocation) {
    const mockPosition = {
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 10 + Math.random() * 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: 0,
      },
      timestamp: Date.now(),
    };

    (navigator as any).geolocation.getCurrentPosition = (success: any) => {
      setTimeout(() => success(mockPosition), 50);
    };

    (navigator as any).geolocation.watchPosition = (success: any) => {
      setTimeout(() => success(mockPosition), 50);
      return Math.floor(Math.random() * 1000);
    };

    console.log(`GPS Spoofing Active: ${lat}, ${lng}`);
  }
};

/**
 * Restores original geolocation behavior (blocking for privacy).
 */
export const clearSpoof = () => {
  if (typeof window !== "undefined" && navigator.geolocation) {
    (navigator as any).geolocation.getCurrentPosition = (success: any, error: any) => {
      if (error) error({ code: 1, message: "User denied Geolocation (Privacy Shield)" });
    };
    (navigator as any).geolocation.watchPosition = (success: any, error: any) => {
      if (error) error({ code: 1, message: "User denied Geolocation (Privacy Shield)" });
      return 0;
    };
  }
};

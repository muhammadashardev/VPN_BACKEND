"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { VpnServer, VPN_SERVERS } from "@/lib/constants";
import { fetchGeoIpData, GeoIpData, getPublicIp } from "@/lib/ipService";
import { checkWebRtcLeak, spoofLocation, clearSpoof } from "@/lib/security";
import { api } from "@/lib/api";

interface VpnContextType {
  isConnected: boolean;
  isConnecting: boolean;
  selectedServer: VpnServer;
  localIp: string;
  currentIp: string;
  sessionTime: number;
  isIpVerified: boolean;
  isWebRtcSecure: boolean;
  isLocationSecure: boolean;
  locationData: GeoIpData | null;
  autoReconnect: boolean;
  isLoggedIn: boolean;
  user: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  selectServer: (server: VpnServer) => void;
  setAutoReconnect: (enabled: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const VpnContext = createContext<VpnContextType | undefined>(undefined);

export const VpnProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState<VpnServer>(VPN_SERVERS[0]);
  const [localIp, setLocalIp] = useState("Detecting...");
  const [currentIp, setCurrentIp] = useState("Detecting...");
  const [sessionTime, setSessionTime] = useState(0);
  const [isIpVerified, setIsIpVerified] = useState(false);
  const [isWebRtcSecure, setIsWebRtcSecure] = useState(true);
  const [isLocationSecure, setIsLocationSecure] = useState(true);
  const [locationData, setLocationData] = useState<GeoIpData | null>(null);
  const [autoReconnect, setAutoReconnectState] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  const networkCheckRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef(false);
  const lastServerRef = useRef<VpnServer | null>(null);

  // Security audit
  const performSecurityAudit = useCallback(async () => {
    try {
      if (isConnected) {
        spoofLocation(selectedServer.lat, selectedServer.lng);
        setIsLocationSecure(true);
      } else {
        clearSpoof();
        setIsLocationSecure(true);
      }
      const leakTest = await checkWebRtcLeak();
      setIsWebRtcSecure(!leakTest.isLeaking);
    } catch (err) {
      console.error("Audit error:", err);
    }
  }, [isConnected, selectedServer.lat, selectedServer.lng]);

  // Check if user is already logged in
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          setIsLoggedIn(true);
          setAutoReconnectState(userData.autoReconnect ?? true);
        })
        .catch(() => {
          api.logout();
          setIsLoggedIn(false);
        });
    }
  }, []);

  // Initial IP fetch
  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchGeoIpData();
        setLocalIp(data.ip);
        setCurrentIp(isConnected ? selectedServer.ip : data.ip);
        setLocationData(isConnected ? {
          ...data,
          ip: selectedServer.ip,
          city: selectedServer.city,
          country: selectedServer.country,
          loc: `${selectedServer.lat},${selectedServer.lng}`
        } : data);
        setTimeout(performSecurityAudit, 1500);
      } catch (error) {
        setLocalIp("Detection failed");
      }
    };
    init();
  }, [performSecurityAudit, isConnected, selectedServer]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // ============================================================
  // Auto-Reconnect: Network Monitoring
  // ============================================================
  useEffect(() => {
    if (!autoReconnect || !isLoggedIn) return;

    const handleOnline = async () => {
      if (wasOfflineRef.current && lastServerRef.current && !isConnected) {
        console.log("Network recovered - auto-reconnecting...");
        wasOfflineRef.current = false;

        // Reconnect to last server
        try {
          setIsConnecting(true);
          const server = lastServerRef.current;
          setSelectedServer(server);

          // Try backend reconnect
          try {
            await api.reconnect('proxy');
          } catch { /* Backend may not be available */ }

          // Set connected state with the last server
          const virtualData: GeoIpData = {
            ip: server.ip,
            city: server.city,
            region: "VPN Region",
            country: server.country,
            loc: `${server.lat},${server.lng}`,
            org: "SecureNet VPN",
            postal: "00000",
            timezone: "UTC"
          };

          setCurrentIp(server.ip);
          setLocationData(virtualData);
          setIsConnected(true);
          setIsConnecting(false);
          performSecurityAudit();
        } catch (err) {
          console.error("Auto-reconnect failed:", err);
          setIsConnecting(false);
        }
      }
    };

    const handleOffline = () => {
      if (isConnected) {
        wasOfflineRef.current = true;
        lastServerRef.current = selectedServer;
        console.log("Network lost - will auto-reconnect when back online");
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check (backup for when browser events don't fire)
    networkCheckRef.current = setInterval(async () => {
      if (!isConnected || !autoReconnect) return;

      try {
        await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
      } catch {
        // Network seems down
        wasOfflineRef.current = true;
        lastServerRef.current = selectedServer;
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkCheckRef.current) clearInterval(networkCheckRef.current);
    };
  }, [autoReconnect, isLoggedIn, isConnected, selectedServer, performSecurityAudit]);

  // ============================================================
  // Connection verify
  // ============================================================
  const verifyConnection = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 8;

    const check = async () => {
      try {
        const publicIp = await getPublicIp();
        if (publicIp !== localIp || attempts > maxAttempts) {
          const virtualIp = selectedServer.ip;
          setCurrentIp(virtualIp);
          setIsIpVerified(publicIp !== localIp);

          const virtualData: GeoIpData = {
            ip: virtualIp,
            city: selectedServer.city,
            region: "VPN Region",
            country: selectedServer.country,
            loc: `${selectedServer.lat},${selectedServer.lng}`,
            org: "SecureNet Proxy Service",
            postal: "00000",
            timezone: "UTC"
          };

          setLocationData(virtualData);
          setIsConnected(true);
          setIsConnecting(false);
          lastServerRef.current = selectedServer;
          performSecurityAudit();
          return true;
        }
      } catch { }
      return false;
    };

    const poll = setInterval(async () => {
      attempts++;
      const success = await check();
      if (success || attempts >= maxAttempts) {
        clearInterval(poll);
        if (attempts >= maxAttempts && !isConnected) {
          setIsConnected(true);
          setIsConnecting(false);
          setCurrentIp(selectedServer.ip);
          setIsIpVerified(false);
          lastServerRef.current = selectedServer;
          performSecurityAudit();
        }
      }
    }, 2500);
  }, [localIp, selectedServer, isConnected, performSecurityAudit]);

  // ============================================================
  // Actions
  // ============================================================
  const connect = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setIsIpVerified(false);

    // Try backend connection if logged in
    if (isLoggedIn) {
      try {
        await api.connect(selectedServer.id, 'proxy');
        await api.saveLocation({
          country: selectedServer.country,
          countryCode: selectedServer.id.toUpperCase(),
          city: selectedServer.city,
          serverId: selectedServer.id
        });
      } catch (err) {
        console.log("Backend connection (optional):", err);
      }
    }

    setTimeout(async () => {
      await verifyConnection();
    }, 2000);
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsIpVerified(false);
    setCurrentIp(localIp);
    setSessionTime(0);

    if (isLoggedIn) {
      api.disconnect('proxy').catch(console.error);
    }

    fetchGeoIpData().then(setLocationData).catch(console.error);
    performSecurityAudit();
  };

  const selectServer = (server: VpnServer) => {
    if (isConnected) return;
    setSelectedServer(server);
  };

  const handleSetAutoReconnect = (enabled: boolean) => {
    setAutoReconnectState(enabled);
    if (isLoggedIn) {
      api.setAutoReconnect(enabled).catch(console.error);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
    setIsLoggedIn(true);
    setAutoReconnectState(data.user.autoReconnect ?? true);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.register(name, email, password);
    setUser(data.user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    if (isConnected) disconnect();
    api.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <VpnContext.Provider
      value={{
        isConnected,
        isConnecting,
        selectedServer,
        localIp,
        currentIp,
        sessionTime,
        isIpVerified,
        isWebRtcSecure,
        isLocationSecure,
        locationData,
        autoReconnect,
        isLoggedIn,
        user,
        connect,
        disconnect,
        selectServer,
        setAutoReconnect: handleSetAutoReconnect,
        login,
        register,
        logout,
      }}
    >
      {children}
    </VpnContext.Provider>
  );
};

export const useVpn = () => {
  const context = useContext(VpnContext);
  if (context === undefined) {
    throw new Error("useVpn must be used within a VpnProvider");
  }
  return context;
};

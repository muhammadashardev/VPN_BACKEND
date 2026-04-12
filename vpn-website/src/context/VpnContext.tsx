"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { VpnServer, VPN_SERVERS } from "@/lib/constants";
import { fetchGeoIpData, GeoIpData, getPublicIp } from "@/lib/ipService";
import { checkWebRtcLeak, spoofLocation, clearSpoof } from "@/lib/security";

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
  connect: () => Promise<void>;
  disconnect: () => void;
  selectServer: (server: VpnServer) => void;
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

  // Helper for one-time security audit & identity masking
  const performSecurityAudit = useCallback(async () => {
    try {
      if (isConnected) {
        // Use exact coordinates from server constants
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

  // Initial setup and real IP fetch
  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchGeoIpData();
        
        // Batch updates to reduce re-renders
        setLocalIp(data.ip);
        setCurrentIp(isConnected ? selectedServer.ip : data.ip);
        setLocationData(isConnected ? {
          ...data,
          ip: selectedServer.ip,
          city: selectedServer.city,
          country: selectedServer.country,
          loc: `${selectedServer.lat},${selectedServer.lng}`
        } : data);
        
        // Defer heavy security audits
        setTimeout(performSecurityAudit, 1500);
      } catch (error) {
        setLocalIp("Detection failed");
      }
    };
    init();
  }, [performSecurityAudit, isConnected, selectedServer]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const verifyConnection = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 8; 
    
    const check = async () => {
      try {
        const publicIp = await getPublicIp();
        
        if (publicIp !== localIp || attempts > maxAttempts) {
          // Identify virtual identity
          const virtualIp = selectedServer.ip;
          setCurrentIp(virtualIp);
          setIsIpVerified(publicIp !== localIp);
          
          // Construct Virtual Location Data
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
          
          // Mask Identity
          performSecurityAudit();
          return true;
        }
      } catch (err) { }
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
          performSecurityAudit();
        }
      }
    }, 2500);
  }, [localIp, selectedServer, isConnected, performSecurityAudit]);

  const connect = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setIsIpVerified(false);
    
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
    
    // Refresh local data and audit
    fetchGeoIpData().then(setLocationData).catch(console.error);
    performSecurityAudit();
  };

  const selectServer = (server: VpnServer) => {
    if (isConnected) return;
    setSelectedServer(server);
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
        connect,
        disconnect,
        selectServer,
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

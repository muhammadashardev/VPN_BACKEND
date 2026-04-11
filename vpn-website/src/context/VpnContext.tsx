"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { VpnServer, VPN_SERVERS } from "@/lib/constants";

interface VpnContextType {
  isConnected: boolean;
  isConnecting: boolean;
  selectedServer: VpnServer;
  localIp: string;
  currentIp: string;
  sessionTime: number;
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

  // Fetch real IP on load
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setLocalIp(data.ip);
        setCurrentIp(data.ip);
      } catch (error) {
        console.error("Failed to fetch real IP:", error);
        setLocalIp("103.255.4.12"); // Fallback mock public IP
        setCurrentIp("103.255.4.12");
      }
    };
    fetchIp();
  }, []);

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

  const connect = async () => {
    if (isConnected) return;
    setIsConnecting(true);
    
    // Simulate connection delay with realistic handshake simulation
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    setIsConnected(true);
    setIsConnecting(false);
    setCurrentIp(selectedServer.ip);
  };

  const disconnect = () => {
    setIsConnected(false);
    setCurrentIp(localIp);
    setSessionTime(0);
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

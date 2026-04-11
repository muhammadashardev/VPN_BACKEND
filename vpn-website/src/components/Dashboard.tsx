"use client";

import React from "react";
import { useVpn } from "@/context/VpnContext";
import { ConnectButton } from "./ConnectButton";
import { LocationSelector } from "./LocationSelector";
import { motion } from "framer-motion";
import { Shield, Zap, Activity, Clock, Lock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const { isConnected, isConnecting, selectedServer, currentIp, sessionTime } = useVpn();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-8 p-6 lg:p-12 overflow-y-auto custom-scrollbar">
      {/* Left Panel: Status and Connection */}
      <div className="flex flex-col flex-1 gap-8 justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: isConnected ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={cn(
                "p-2 rounded-xl border",
                isConnected ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
              )}
            >
              <Shield className="h-6 w-6" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent"
              >
                SecureNet Pro
              </motion.h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isConnected ? "bg-cyan-500 shadow-[0_0_8px_#06b6d2]" : "bg-zinc-600")} />
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
                  {isConnected ? "Connection Secure" : isConnecting ? "Establishing Tunnel..." : "Disconnected • Not Protected"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 py-12 relative">
          {/* Decorative background glow */}
          <div className={cn(
            "absolute inset-0 blur-[120px] rounded-full transition-colors duration-1000 opacity-20",
            isConnected ? "bg-cyan-500" : "bg-rose-500"
          )} />
          <ConnectButton />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard 
            icon={<Lock className={cn("h-4 w-4", isConnected ? "text-cyan-400" : "text-zinc-500")} />}
            label="Encryption"
            value="AES-256-GCM"
          />
          <StatCard 
            icon={<Zap className="h-4 w-4 text-yellow-400" />}
            label="Protocol"
            value="WireGuard v2"
          />
          <StatCard 
            icon={<Activity className={cn("h-4 w-4", isConnected ? "text-emerald-400" : "text-amber-400")} />}
            label="Digital Identity"
            value={currentIp === "Detecting..." ? "Scanning..." : currentIp}
            subValue={isConnected ? "IP Masks (Secure)" : "Exposed (Local)"}
          />
          <StatCard 
            icon={<Clock className="h-4 w-4 text-purple-400" />}
            label="Uptime"
            value={formatTime(sessionTime)}
          />
        </div>
      </div>

      {/* Right Panel: Map and Location Selection */}
      <div className="flex flex-col w-full lg:w-[450px] gap-8">
        {/* World Map visualization */}
        <div className="relative h-[250px] w-full rounded-3xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden border border-white/[0.05] shadow-2xl flex flex-col">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
          
          <div className="flex-1 relative">
            {/* Animated connection line visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Simulated connection nodes */}
                <motion.div 
                  animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute top-1/2 left-1/4 h-2 w-2 bg-white rounded-full opacity-30" 
                />
                <motion.div 
                  animate={{ scale: isConnected ? [1, 1.5, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute bottom-1/3 right-1/4 h-2 w-2 bg-cyan-500 rounded-full" 
                />
                {isConnected && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <motion.path
                      d="M100,125 Q175,75 250,125"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#06b6d2" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
            </div>
            
            <div className="absolute top-4 left-4 p-2 px-3 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 flex items-center gap-2">
              <MapPin className="h-3 w-3 text-cyan-500" />
              <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">Global Network Active</span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="text-2xl drop-shadow-md">{selectedServer.flag}</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-white text-xs font-medium truncate">{selectedServer.country}</div>
                <div className="text-zinc-500 text-[10px] truncate max-w-full">
                  {selectedServer.city} • <span className="font-mono">{selectedServer.ip}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-zinc-500 uppercase">Latency</span>
                <span className="text-xs font-mono text-cyan-500">{selectedServer.latency}ms</span>
              </div>
            </div>
          </div>
        </div>

        <LocationSelector />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue?: string }) => (
  <motion.div 
    whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
    className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-1 transition-colors group"
  >
    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">
      {icon}
      {label}
    </div>
    <div className="text-white font-mono text-sm sm:text-base truncate">
      {value}
    </div>
    {subValue && (
      <div className={cn(
        "text-[9px] uppercase tracking-tighter font-bold",
        subValue.includes("Secure") ? "text-cyan-500/80" : "text-amber-500/80"
      )}>
        {subValue}
      </div>
    )}
  </motion.div>
);

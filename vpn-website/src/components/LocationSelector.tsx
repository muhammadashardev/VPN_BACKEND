"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Signal, Check, Search, X } from "lucide-react";
import { useVpn } from "@/context/VpnContext";
import { VPN_SERVERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const LocationSelector = () => {
  const { selectedServer, selectServer, isConnected } = useVpn();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServers = useMemo(() => {
    return VPN_SERVERS.filter((server) =>
      server.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-zinc-400 font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Location
        </h3>
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
          {filteredServers.length} Available
        </span>
      </div>

      {/* Modern Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search 250+ countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-cyan-500/50 focus:bg-white/[0.06] rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {filteredServers.length > 0 ? (
            filteredServers.map((server) => (
              <motion.button
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={server.id}
                onClick={() => selectServer(server)}
                disabled={isConnected}
                className={cn(
                  "group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
                  selectedServer.id === server.id
                    ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10",
                  isConnected && selectedServer.id !== server.id && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl drop-shadow-sm">{server.flag}</div>
                  <div className="text-left">
                    <div className="text-white font-medium text-sm leading-tight">{server.country}</div>
                    <div className="text-zinc-500 text-[10px] mt-0.5">{server.city}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <Signal className={cn(
                        "h-2.5 w-2.5",
                        server.latency < 50 ? "text-emerald-500" : server.latency < 100 ? "text-amber-500" : "text-rose-500"
                      )} />
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {server.latency}ms
                      </span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">
                      LOAD: {server.load}%
                    </div>
                  </div>
                  
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300",
                    selectedServer.id === server.id ? "bg-cyan-500 text-black scale-100 rotate-0" : "bg-white/5 text-transparent scale-0 -rotate-90 group-hover:scale-100 group-hover:rotate-0 group-hover:bg-white/10"
                  )}>
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-zinc-500"
            >
              <Search className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No locations found for "{searchQuery}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

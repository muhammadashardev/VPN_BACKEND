"use client";

import React from "react";
import { motion } from "framer-motion";
import { Power } from "lucide-react";
import { useVpn } from "@/context/VpnContext";
import { cn } from "@/lib/utils";

export const ConnectButton = () => {
  const { isConnected, isConnecting, connect, disconnect } = useVpn();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Outer Glow Ring */}
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.1, 1] : 1,
            opacity: isConnected ? [0.4, 0.7, 0.4] : 0.2,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn(
            "absolute -inset-8 rounded-full blur-2xl transition-colors duration-1000",
            isConnected ? "bg-cyan-500" : "bg-zinc-800"
          )}
        />

        {/* Outer Border Ring */}
        <div className={cn(
          "absolute -inset-4 rounded-full border-2 transition-colors duration-1000",
          isConnected ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "border-zinc-800"
        )} />

        <button
          onClick={handleClick}
          disabled={isConnecting}
          className={cn(
            "relative group flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500",
            isConnected 
              ? "bg-zinc-900 shadow-[inset_0_2px_10px_rgba(6,182,212,0.3)]" 
              : "bg-zinc-900 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]"
          )}
        >
          {/* Inner Button Gradient */}
          <div className={cn(
            "absolute inset-1 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 transition-opacity duration-500",
            isConnected ? "opacity-0" : "opacity-100"
          )} />
          
          <div className={cn(
            "absolute inset-1 rounded-full bg-gradient-to-br from-cyan-500/20 to-zinc-950 transition-opacity duration-500",
            isConnected ? "opacity-100" : "opacity-0"
          )} />

          <motion.div
            animate={isConnecting ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="z-10"
          >
            <Power
              className={cn(
                "h-12 w-12 transition-all duration-500",
                isConnected ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "text-zinc-600 group-hover:text-zinc-400",
                isConnecting && "opacity-50"
              )}
            />
          </motion.div>
        </button>
      </div>

      <div className="text-center z-10">
        <h3 className={cn(
          "text-xl font-bold tracking-wider uppercase transition-colors duration-500",
          isConnected ? "text-cyan-400" : "text-zinc-500"
        )}>
          {isConnecting ? "Connecting..." : isConnected ? "Protected" : "Disconnected"}
        </h3>
        <p className="text-zinc-500 text-sm mt-1">
          {isConnected ? "VPN is active" : "Tap to secure connection"}
        </p>
      </div>
    </div>
  );
};

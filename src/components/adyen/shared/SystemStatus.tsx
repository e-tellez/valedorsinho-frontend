"use client";

import { useEffect, useState } from "react";

export default function SystemStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
        const response = await fetch("/api/config/client", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (mounted) {
          setIsOnline(response.ok);
        }
      } catch {
        if (mounted) {
          setIsOnline(false);
        }
      }
    };

    checkBackend();

    return () => {
      mounted = false;
    };
  }, []);

  const statusColor = isOnline === null 
    ? "bg-[#ff4444]" 
    : isOnline 
    ? "bg-[#00ff88]" 
    : "bg-[#ff4444]";
  
  const statusShadow = isOnline === null
    ? "shadow-[0_0_8px_rgba(255,68,68,0.6)]"
    : isOnline
    ? "shadow-[0_0_8px_rgba(0,255,136,0.6)]"
    : "shadow-[0_0_8px_rgba(255,68,68,0.6)]";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 dark:border-[#1a2332] bg-gray-50 dark:bg-[#0a0f1e] rounded-none">
      <div className={`w-2 h-2 ${statusColor} rounded-full ${statusShadow} ${isOnline === null ? "animate-pulse" : isOnline ? "animate-pulse" : ""}`} />
      <span className="font-mono text-[0.625rem] font-bold tracking-wider uppercase text-gray-600 dark:text-[#8b949e]">
        System {isOnline === null ? "Checking..." : isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}

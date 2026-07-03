"use client";

import { useEffect, useRef } from "react";

export default function BannerAdCard({ adId, isActive }: { adId: string; isActive: boolean }) {  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "//miserly-wrap.com/b.X/VdsSdPG_lC0rYlW/cQ/oeCme9-uSZQU/l/kpPNTIc/xcOHDtg/2-OPDAkit/NyzaEO4PO/D/YN5/Mzwh";
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    // The vendor snippet passes settings as an IIFE arg (s.settings = sxdqy || {}).
    // Replicate that here rather than relying on their inline closure.
    (script as any).settings = {};

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [adId]);

  return <div ref={containerRef} className="native-ad-card" />;
}
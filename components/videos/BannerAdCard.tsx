"use client";

import { useEffect, useRef } from "react";

export default function BannerAdCard({ adId, isActive }: { adId: string; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!isActive || hasLoaded.current) return;
    const container = containerRef.current;
    if (!container) return;

    hasLoaded.current = true;
    const script = document.createElement("script");
    script.src =
      "//miserly-wrap.com/b.X/VdsSdPG_lC0rYlW/cQ/oeCme9-uSZQU/l/kpPNTIc/xcOHDtg/2-OPDAkit/NyzaEO4PO/D/YN5/Mzwh";
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    (script as any).settings = {};
    container.appendChild(script);
  }, [isActive]);

  return <div ref={containerRef} className="native-ad-card" />;
}
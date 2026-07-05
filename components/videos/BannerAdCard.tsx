"use client";

import { useEffect, useRef } from "react";
import { adController } from "../../lib/adController";

interface BannerAdCardProps {
  adId: string;
  zoneId: string; // Adsterra HPF key
}

export default function BannerAdCard({ adId, zoneId }: BannerAdCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    adController.mountAd(containerRef.current, zoneId);
  }, [zoneId]);

  return (
    <div
      ref={containerRef}
      data-ad-id={adId}
      style={{
        width: "100%",
        minHeight: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
      }}
    />
  );
}

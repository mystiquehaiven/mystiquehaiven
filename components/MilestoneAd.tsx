"use client";

import { useEffect, useRef } from "react";
import { adController } from "../lib/adController";

interface MilestoneAdProps {
  adId: string;
  zoneId: string; // Adsterra HPF key
  isActive: boolean;
}

export default function MilestoneAd({ adId, zoneId, isActive }: MilestoneAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    adController.mountAd(containerRef.current, zoneId);
  }, [zoneId, isActive]);

  return (
    <div
      ref={containerRef}
      data-ad-id={adId}
      style={{
        width: "100%",
        minHeight: 50,
        background: "#000",
      }}
    />
  );
}

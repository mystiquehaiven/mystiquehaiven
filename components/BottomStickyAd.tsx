"use client";

import { useEffect, useRef } from "react";
import { adController } from "../lib/adController";

interface BottomStickyAdProps {
  zoneId: string; // Adsterra HPF key
}

export default function BottomStickyAd({ zoneId }: BottomStickyAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    adController.mountAd(containerRef.current, zoneId);
    console.log("Zone ID Bottom Stick: ", zoneId)
  }, [zoneId]);

  return (
    <div
      ref={containerRef}
      className="bottom-sticky-ad"
      style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        height: 50,
        overflow: "hidden",
        background: "#000",
        zIndex: 9999,
      }}
    />
  );
}

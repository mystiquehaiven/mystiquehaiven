"use client";

import { useEffect, useRef } from "react";
import { adController } from "../lib/adController";

interface BottomStickyAdProps {
  zoneId: string;        // Hilltop sticky zone
  adsterraZone: string;  // Adsterra sticky zone
}

export default function BottomStickyAd({
  zoneId,
  adsterraZone,
}: BottomStickyAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Mount
  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", { detail: { adId: "bottom-sticky" } })
    );

    adController.mountAd(containerRef.current, zoneId, adsterraZone);
    console.log("Zones:", zoneId, adsterraZone);

  }, [zoneId, adsterraZone]);

  // Visibility
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ad-slot-visible", { detail: { adId: "bottom-sticky" } })
    );
  }, []);

  // Refresh
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.adId !== "bottom-sticky") return;

      if (containerRef.current) {
        adController.refreshAd(containerRef.current, zoneId, adsterraZone);
      }
    };

    window.addEventListener("ad-fill-request", handler as EventListener);
    return () =>
      window.removeEventListener("ad-fill-request", handler as EventListener);
  }, [zoneId, adsterraZone]);

  return (
    <div
      ref={containerRef}
      className="bottom-sticky-ad"
      style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        minHeight: 90,
        background: "#000",
        zIndex: 9999,
      }}
    />
  );
}

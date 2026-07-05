"use client";

import { useEffect, useRef } from "react";
import { adController } from "../lib/adController";

interface MilestoneAdProps {
  adId: string;
  zoneId: string;        // Hilltop in-page push zone
  adsterraZone: string;  // Adsterra fallback zone
  isActive: boolean;
}

export default function MilestoneAd({
  adId,
  zoneId,
  adsterraZone,
  isActive,
}: MilestoneAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Mount
  useEffect(() => {
    if (!containerRef.current || mountedRef.current || !isActive) return;
    mountedRef.current = true;

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", { detail: { adId } })
    );

    adController.mountAd(containerRef.current, zoneId, adsterraZone);
    console.log("Zones:", zoneId, adsterraZone);
  }, [adId, zoneId, adsterraZone, isActive]);

  // Visibility
  useEffect(() => {
    if (isActive) {
      window.dispatchEvent(
        new CustomEvent("ad-slot-visible", { detail: { adId } })
      );
    }
  }, [isActive, adId]);

  // Refresh
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.adId !== adId) return;

      if (containerRef.current) {
        adController.refreshAd(containerRef.current, zoneId, adsterraZone);
      }
    };

    window.addEventListener("ad-fill-request", handler as EventListener);
    return () =>
      window.removeEventListener("ad-fill-request", handler as EventListener);
  }, [adId, zoneId, adsterraZone]);

  return (
    <div
      ref={containerRef}
      className="milestone-ad"
      style={{
        width: "100%",
        minHeight: 250,
        background: "#000",
      }}
    />
  );
}

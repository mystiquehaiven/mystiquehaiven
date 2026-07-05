"use client";

import { useEffect, useRef, useState } from "react";
import { adController } from "@/lib/adController";

interface BannerAdCardProps {
  adId: string;
  isActive: boolean;
  zone250: string;       // Hilltop desktop zone
  zone100: string;       // Hilltop mobile zone
  adsterraZone: string;  // Adsterra zone
}

export default function BannerAdCard({
  adId,
  isActive,
  zone250,
  zone100,
  adsterraZone,
}: BannerAdCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [zoneId, setZoneId] = useState<string | null>(null);

  // Select correct zone based on viewport
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setZoneId(isMobile ? zone100 : zone250);
  }, [zone250, zone100]);

  // Emit mount event + mount via controller
  useEffect(() => {
    if (!containerRef.current || mountedRef.current || !zoneId) return;
    mountedRef.current = true;

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", { detail: { adId } })
    );

    adController.mountAd(containerRef.current, zoneId, adsterraZone);
    console.log("Zones:", zoneId, adsterraZone);
  }, [zoneId, adId, adsterraZone]);

  // Visibility event
  useEffect(() => {
    if (isActive) {
      window.dispatchEvent(
        new CustomEvent("ad-slot-visible", { detail: { adId } })
      );
    }
  }, [isActive, adId]);

  // Refresh listener
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.adId !== adId) return;

      if (containerRef.current && zoneId) {
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
      data-ad-id={adId}
      className="native-ad-card"
      style={{
        width: "100%",
        minHeight: 250,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
      }}
    />
  );
}

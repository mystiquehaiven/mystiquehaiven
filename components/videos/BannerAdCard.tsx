"use client";

import { useEffect, useRef, useState } from "react";
import { adController } from "@/lib/adController";

interface BannerAdCardProps {
  adId: string;
  isActive: boolean;
  zone250: string; // MultiTag 300x250
  zone100: string; // MultiTag 300x100 (mobile only)
}

export default function BannerAdCard({
  adId,
  isActive,
  zone250,
  zone100,
}: BannerAdCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [zoneId, setZoneId] = useState<string | null>(null);

  // Determine correct zone
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setZoneId(isMobile ? zone100 : zone250);
  }, [zone250, zone100]);

  // Emit mount event
  useEffect(() => {
    if (!containerRef.current || mountedRef.current || !zoneId) return;
    mountedRef.current = true;

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", { detail: { adId } })
    );

    mountAd();
  }, [zoneId]);

  // Visibility nudge
  useEffect(() => {
    if (isActive) {
      window.dispatchEvent(
        new CustomEvent("ad-slot-visible", { detail: { adId } })
      );
    }
  }, [isActive]);

  // Listen for refresh requests
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.adId !== adId) return;
      refreshAd();
    };

    window.addEventListener("ad-fill-request", handler as EventListener);
    return () =>
      window.removeEventListener("ad-fill-request", handler as EventListener);
  }, [adId, zoneId]);

  function mountAd() {
    if (!containerRef.current || !zoneId) return;

    containerRef.current.innerHTML = "";

    const adDiv = document.createElement("div");
    adDiv.setAttribute("data-ht-zone", zoneId);
    adDiv.style.width = "100%";
    adDiv.style.maxWidth = "300px";
    adDiv.style.margin = "0 auto";

    containerRef.current.appendChild(adDiv);

    const script = document.createElement("script");
    script.src = "https://js.hilltopads.com/ht.js";
    script.async = true;
    containerRef.current.appendChild(script);
  }

  function refreshAd() {
    mountAd();
  }

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

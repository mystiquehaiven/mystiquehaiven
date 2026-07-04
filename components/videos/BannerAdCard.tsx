"use client";

import { useEffect, useRef, useState } from "react";

interface BannerAdCardProps {
  adId: string;
  isActive: boolean;

  // Pass your zone IDs from parent
  zone250: string; // MultiTag 300x250 (desktop + mobile)
  zone100: string; // MultiTag 300x100 (mobile-only)
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

  

  // Pick correct zone based on viewport width
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setZoneId(isMobile ? zone100 : zone250);
  }, [zone250, zone100]);

  // One-time mount: create fresh DOM slot + load Hilltop script
  useEffect(() => {
    if (!containerRef.current) return;
    if (!zoneId) return;
    if (mountedRef.current) return;

    mountedRef.current = true;

    // Create the ad container
    const adDiv = document.createElement("div");
    adDiv.setAttribute("data-ht-zone", zoneId);
    adDiv.style.width = "100%";
    adDiv.style.maxWidth = "300px";
    adDiv.style.margin = "0 auto";

    containerRef.current.appendChild(adDiv);

    // Load Hilltop script
    const script = document.createElement("script");
    script.src = "https://js.hilltopads.com/ht.js";
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
      adDiv.remove();
    };
  }, [zoneId]);

  // Visibility nudge (lightweight)
  useEffect(() => {
    if (!isActive) return;
    window.dispatchEvent(new Event("resize"));
  }, [isActive]);

  useEffect(() => {
  if (!mountedRef.current && containerRef.current) {
    mountedRef.current = true;

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", {
        detail: { adId },
      })
    );
  }
}, []);


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

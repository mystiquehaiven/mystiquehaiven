"use client";

import { useEffect, useRef } from "react";

interface BottomStickyAdProps {
  zoneId: string; // MultiTag 300x250 zone
}

export default function BottomStickyAd({ zoneId }: BottomStickyAdProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load HilltopAds script once
  useEffect(() => {
    if (!zoneId) return;

    const script = document.createElement("script");
    script.src = "https://js.hilltopads.com/ht.js";
    script.async = true;
    containerRef.current?.appendChild(script);

    return () => {
      script.remove();
    };
  }, [zoneId]);

  // Visibility-based refresh
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          window.dispatchEvent(
            new CustomEvent("ad-slot-visible", {
              detail: { adId: "bottom-sticky" },
            })
          );
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-ad-id="bottom-sticky"
      style={{
        position: "sticky",
        bottom: 0,
        width: "100%",
        zIndex: 999,
        background: "transparent",
        display: "flex",
        justifyContent: "center",
        padding: "6px 0",
      }}
    >
      <div
        className="hilltopads-container"
        data-ht-zone={zoneId}
        style={{ width: "100%", maxWidth: 300 }}
      />
    </div>
  );
}

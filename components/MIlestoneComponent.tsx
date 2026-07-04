"use client";

import { useEffect, useRef, useState } from "react";

interface MilestoneAdProps {
  zoneId: string; // Hilltop In-Page Push zone
  activeIndex: number; // from VideoFeed
}

export default function MilestoneAd({ zoneId, activeIndex }: MilestoneAdProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Time-based trigger (2 minutes)
  useEffect(() => {
    if (hasTriggered) return;

    const timer = setTimeout(() => {
      setShouldShow(true);
      setHasTriggered(true);
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [hasTriggered]);

  // Scroll-based trigger (20 videos)
  useEffect(() => {
    if (hasTriggered) return;
    if (activeIndex >= 20) {
      setShouldShow(true);
      setHasTriggered(true);
    }
  }, [activeIndex, hasTriggered]);

  // Load Hilltop script once the milestone is reached
  useEffect(() => {
    if (!shouldShow || !containerRef.current) return;

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

    return () => {
      script.remove();
      adDiv.remove();
    };
  }, [shouldShow, zoneId]);

  if (!shouldShow) return null;

  return (
    <div
      ref={containerRef}
      data-ad-id="milestone-ad"
      style={{
        width: "100%",
        padding: "20px 0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
      }}
    />
  );
}

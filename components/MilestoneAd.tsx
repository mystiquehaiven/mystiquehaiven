"use client";

import { useEffect, useRef, useState } from "react";

export default function MilestoneAd({
  zoneId,
  activeIndex,
}: {
  zoneId: string;
  activeIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Time trigger (2 minutes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, 120000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll trigger (20 videos)
  useEffect(() => {
    if (activeIndex >= 20) {
      setShouldShow(true);
    }
  }, [activeIndex]);

  // Mount event
  useEffect(() => {
    if (!shouldShow || mounted || !containerRef.current) return;
    setMounted(true);

    window.dispatchEvent(
      new CustomEvent("ad-slot-mounted", { detail: { adId: "milestone-ad" } })
    );

    mountAd();
  }, [shouldShow]);

  // Visibility event
  useEffect(() => {
    if (!shouldShow || !containerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          window.dispatchEvent(
            new CustomEvent("ad-slot-visible", {
              detail: { adId: "milestone-ad" },
            })
          );
        }
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldShow]);

  // Refresh listener (milestone only triggers once)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.adId !== "milestone-ad") return;
      mountAd();
    };

    window.addEventListener("ad-fill-request", handler as EventListener);
    return () =>
      window.removeEventListener("ad-fill-request", handler as EventListener);
  }, []);

  function mountAd() {
    if (!containerRef.current) return;

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
        background: "transparent",
      }}
    />
  );
}

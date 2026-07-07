"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // adjust path to wherever AuthProvider lives
import { loadHilltopStickyAd } from "@/lib/ads/hilltop";

const EXCLUDED_PATHS = ["/videos"];
const ZONE_ID = "bottom-sticky";
const ZONE_SRC = "//miserly-wrap.com/btXBVasPd.GilW0-Y/WHcJ/veWmX9_uCZ/UXlTkaP/TycZxPOSTVgvydMWDmkqtQNEzuE/5qOMDZIIxLM/wz";

export default function BottomStickyAd() {
  const pathname = usePathname();
  const { loading, isAdmin } = useAuth();

  const excluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (loading || isAdmin || excluded) return;
    loadHilltopStickyAd(ZONE_ID, ZONE_SRC);
  }, [loading, isAdmin, excluded]);

  return null;
}
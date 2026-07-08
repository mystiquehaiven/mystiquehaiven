const loadedZones = new Set<string>();

export function loadHilltopAd(adId: string) {
  if (loadedZones.has(adId)) return;
  loadedZones.add(adId);

  const ZONE_SRC_MAP: Record<string, string> = {
  "in-page-1": "//miserly-wrap.com/b/X/Vishd.GGlS0ZYLWrcR/WeFmb9BuGZtUGlxkPP-T/cHxFO_T/co1GMKT/MetXNIzHEZ5BNLzaUPx/NSwC",
  "in-page-2": "//miserly-wrap.com/b/XJV.sadVGflz0uYLW/cV/jeumw9/uSZVUYlLk/P-TJcpxwOATpQywWOPDTEFtvNIzgEW5/NKDOA/4dNrQt"
  // etc
};

  const src = ZONE_SRC_MAP[adId];
  if (!src) {
    console.error(`No Hilltop zone script configured for adId: ${adId}`);
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = src;
  document.body.appendChild(script);
}

export function loadHilltopStickyAd(zoneId: string, src: string) {
  if (loadedZones.has(zoneId)) return;
  loadedZones.add(zoneId);

  const script = document.createElement("script");
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = src;
  document.body.appendChild(script);
}
const loadedZones = new Set<string>();

export function loadHilltopAd(adId: string) {
  if (loadedZones.has(adId)) return;
  loadedZones.add(adId);

  const ZONE_SRC_MAP: Record<string, string> = {
  "your-in-page-zone-id-1": "//miserly-wrap.com/bPXBVvs.dWGxlA0VYnW/cH/meqmp9_uRZTUKl/kcPyTqcaxtORThcX1oMATUMYtyNvz/EP5/N/z/UuxdNowC",
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
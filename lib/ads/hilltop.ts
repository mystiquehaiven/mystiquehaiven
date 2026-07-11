const loadedZones = new Set<string>();

export const ZONE_SRC_MAP: Record<string, string> = {
  "in-page-1": "//miserly-wrap.com/b/X/Vishd.GGlS0ZYLWrcR/WeFmb9BuGZtUGlxkPP-T/cHxFO_T/co1GMKT/MetXNIzHEZ5BNLzaUPx/NSwC",
  "in-page-2": "//miserly-wrap.com/b/XJV.sadVGflz0uYLW/cV/jeumw9/uSZVUYlLk/P-TJcpxwOATpQywWOPDTEFtvNIzgEW5/NKDOA/4dNrQt",
  "in-page-push": "//miserly-wrap.com/bWX_VFswd.G/l/0HYZW/cn/Ne/mk9iudZIUdlUkQPWT/c/xcOWTKEsyLOITkc/tdNKzPEC5aMiThMowwMAQm"
};

// Injects the ad script AS A CHILD of the given container, so any
// DOM-relative insertion logic the ad network uses lands inside it,
// not at document.body.
export function loadHilltopAdInto(container: HTMLElement, zoneId: string) {
  const src = ZONE_SRC_MAP[zoneId];
  if (!src) {
    console.error(`No Hilltop zone script configured for zoneId: ${zoneId}`);
    return null;
  }

  const script = document.createElement("script");
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = src;
  container.appendChild(script);
  return script;
}

// Used by BottomStickyAd — legitimately body-level, since a sticky
// footer ad isn't scoped to any single feed item's container.
export function loadHilltopStickyAd(zoneId: string, src: string) {
  if (loadedZones.has(zoneId)) return;
  loadedZones.add(zoneId);

  const script = document.createElement("script");
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = src;
  document.body.appendChild(script);
}
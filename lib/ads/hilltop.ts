const loadedZones = new Set<string>();

export const ZONE_SRC_MAP: Record<string, string> = {
  "in-page-1": "//miserly-wrap.com/b/X/Vishd.GGlS0ZYLWrcR/WeFmb9BuGZtUGlxkPP-T/cHxFO_T/co1GMKT/MetXNIzHEZ5BNLzaUPx/NSwC",
  "in-page-2": "//miserly-wrap.com/b/XJV.sadVGflz0uYLW/cV/jeumw9/uSZVUYlLk/P-TJcpxwOATpQywWOPDTEFtvNIzgEW5/NKDOA/4dNrQt",
  "in-page-3": "//miserly-wrap.com/bKXCV.s/d/Gzl/0/YJW/cI/Oe/mz9huMZ/Udlkk-PTTIcexmOWTNce1NM_THMBtlNXz/E-5pNlzNUlxdNkwq",
  "in-page-4": "//miserly-wrap.com/bzX.VisDdeG_lx0aYkWjcr/PeDmI9eu/ZFUBlYk/PbTBcix/OuT/cZ1QMKTTM/t/N/z/Ee5ONCzRULxlNowT",
  "in-page-5": "//miserly-wrap.com/bvXuV.swdMG/lR0/YyW/cu/BeMmh9/uUZJUAlBkrPgTWcPx/OLTocb1/MHTWM-trNXzdEG5hNzzGUdxmNEwS",
  "in-page-6": "//miserly-wrap.com/b.XOV/sUdSGxlC0wYVWtcv/jeTmc9/uUZTUDlhkQPTTQcEx/ODTycf1mMVTQM/t/N/z/Eh5jNtzEUrx/NFw-",
  "in-page-7": "//miserly-wrap.com/b_X.VmsIdDGnlI0/YfWDcK/Leam/9zuwZgUblmkMPJTAcvx/OITvcW1zMCTRMUtoNwzoEz5lNszRU/xHNuwi",
  "in-page-8": "//miserly-wrap.com/b.XRVHs/dfG_lo0fYFWYcY/ieOmf9lu/ZZU/lhk/PaTic_xSOXTKcg1SMETsM/tgN/zTEc5/NWznUuxSN/wt",
  "in-page-9": "//miserly-wrap.com/bwX.V/sedjGblW0lYfWicv/oe/mO9dubZ/UNlPk/PjTpc/xLOFTIcC1hMGTyMhtWNzzkE-5/NgzjUqxEN/wy",
  "in-page-10": "//miserly-wrap.com/bgXyVfs.dyGHlp0xYOW-cq/Be/ms9XuKZnUhlMkRPUTTc/x/OiT/cd1/MiTLMktTNezOEW5/NCzrUqx/Nzwc",
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
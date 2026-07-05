import { HilltopAdapter } from "../lib/ads/adAdapters";
import { AdsterraAdapter } from "../lib/ads/adAdapters";
import { FallbackAdapter } from "../lib/ads/adAdapters";

class AdController {
  private geo: string | null = null;

  private adapters = {
    hilltop: HilltopAdapter,
    adsterra: AdsterraAdapter,
    fallback: FallbackAdapter,
  };

  async loadGeo() {
    if (this.geo) return this.geo;

    try {
      const res = await fetch("/api/geo");
      const data = await res.json();
      this.geo = data.country || "US";
    } catch {
      this.geo = "US";
    }

    return this.geo;
  }

  chooseAdapterByGeo() {
    if (!this.geo) return this.adapters.hilltop;

    const country = this.geo.toUpperCase();

    // Tier‑1 / Tier‑2 → Hilltop
    if (["US", "CA", "UK", "AU", "NZ", "DE", "FR", "SE", "NO"].includes(country)) {
      return this.adapters.hilltop;
    }

    // Tier‑3 / Tier‑4 → Adsterra
    if (["IN", "PK", "BD", "ID", "PH", "NG", "ZA", "KE", "GH"].includes(country)) {
      return this.adapters.adsterra;
    }

    // Everything else → fallback
    return this.adapters.fallback;
  }

  async mountAd(container: HTMLElement, hilltopZone: string, adsterraZone: string) {
    await this.loadGeo();

    const primaryAdapter = this.chooseAdapterByGeo();
    const fallbackAdapter =
      primaryAdapter === this.adapters.hilltop
        ? this.adapters.adsterra
        : this.adapters.hilltop;

    const zoneId =
      primaryAdapter.name === "hilltop" ? hilltopZone : adsterraZone;

    // Try primary
    const ok = await primaryAdapter.mount(container, zoneId);
    if (ok) return;

    // Try fallback
    const fallbackZone =
      fallbackAdapter.name === "hilltop" ? hilltopZone : adsterraZone;

    const ok2 = await fallbackAdapter.mount(container, fallbackZone);
    if (ok2) return;

    // Final fallback
    await this.adapters.fallback.mount(container, hilltopZone);
  }

  async refreshAd(container: HTMLElement, hilltopZone: string, adsterraZone: string) {
    await this.mountAd(container, hilltopZone, adsterraZone);
  }
}

export const adController = new AdController();

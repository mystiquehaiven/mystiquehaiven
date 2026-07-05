import { AdsterraHPFAdapter } from "../lib/ads/AdsterraHPFAdapter";

const FallbackAdapter = {
  name: "fallback",
  async mount(container: HTMLElement) {
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 50px;
        background: #111;
        color: #aaa;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        No ads available
      </div>
    `;
    return true;
  },
};

class AdController {
  private adapters = [AdsterraHPFAdapter, FallbackAdapter];

  async mountAd(container: HTMLElement, key: string) {
    for (const adapter of this.adapters) {
      const ok = await adapter.mount(container, key);
      if (ok) return;
    }
  }

  async refreshAd(container: HTMLElement, key: string) {
    await this.mountAd(container, key);
  }
}

export const adController = new AdController();

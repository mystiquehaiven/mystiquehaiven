type FillRequest = {
	adId: string;
};

type AdNetwork = "networkA" | "networkB";

class AdNetworkBridge {
	private lastFill: Map<string, number> = new Map();
	private cooldownMs = 10_000;

	constructor() {
		if (typeof window !== "undefined") {
			this.init();
		}
	}

	private init() {
		window.addEventListener(
			"ad-fill-request",
			this.onFillRequest as EventListener
		);
	}

	private onFillRequest = (event: CustomEvent<FillRequest>) => {
		const { adId } = event.detail;

		const now = Date.now();
		const last = this.lastFill.get(adId) ?? 0;

		// global safety throttle (extra layer beyond controller)
		if (now - last < this.cooldownMs) return;

		this.lastFill.set(adId, now);

		this.executeFill(adId);
	};

	private executeFill(adId: string) {
		// Decide which network to use
		const network = this.selectNetwork(adId);

		switch (network) {
			case "networkA":
				this.triggerNetworkA(adId);
				break;
			case "networkB":
				this.triggerNetworkB(adId);
				break;
		}
	}

	private selectNetwork(adId: string): AdNetwork {
		// Simple stable hash-based routing (prevents flicker)
		let hash = 0;
		for (let i = 0; i < adId.length; i++) {
			hash = (hash * 31 + adId.charCodeAt(i)) >>> 0;
		}

		return hash % 2 === 0 ? "networkA" : "networkB";
	}

	private triggerNetworkA(adId: string) {
		// Network A (miserly-wrap / first script)

		// Most ad scripts rely on DOM scan or resize triggers.
		// We keep it minimal and consistent.
		window.dispatchEvent(new Event("resize"));
	}

	private triggerNetworkB(adId: string) {
		// Network B (sturdy-prompt / second script)

		// Same controlled trigger, but isolated routing.
		window.dispatchEvent(new Event("resize"));
	}

	public reset() {
		this.lastFill.clear();
	}
}

// singleton
export const adNetworkBridge = new AdNetworkBridge();
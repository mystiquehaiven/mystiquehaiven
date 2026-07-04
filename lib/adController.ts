type AdEvent = {
	adId: string;
};

type AdState = {
	lastShown: number;
	lastMounted: number;
};

class AdController {
	private state: Map<string, AdState> = new Map();
	private cooldownMs = 15_000; // prevents spam refresh per slot

	constructor() {
		if (typeof window !== "undefined") {
			this.init();
		}
	}

	private init() {
		window.addEventListener("ad-slot-mounted", this.onMounted as EventListener);
		window.addEventListener("ad-slot-visible", this.onVisible as EventListener);
	}

	private onMounted = (event: CustomEvent<AdEvent>) => {
		const { adId } = event.detail;

		const current = this.getState(adId);
		current.lastMounted = Date.now();

		this.state.set(adId, current);
	};

	private onVisible = (event: CustomEvent<AdEvent>) => {
		const { adId } = event.detail;

		const now = Date.now();
		const current = this.getState(adId);

		// cooldown guard (prevents duplicate fills)
		if (now - current.lastShown < this.cooldownMs) {
			return;
		}

		current.lastShown = now;
		this.state.set(adId, current);

		this.triggerAdFill(adId);
	};

	private triggerAdFill(adId: string) {
		// This is the ONLY place ad refresh should happen

		// generic signal for any ad network adapters
		window.dispatchEvent(
			new CustomEvent("ad-fill-request", {
				detail: { adId },
			})
		);
	}

	private getState(adId: string): AdState {
		if (!this.state.has(adId)) {
			this.state.set(adId, {
				lastShown: 0,
				lastMounted: 0,
			});
		}
		return this.state.get(adId)!;
	}

	public reset() {
		this.state.clear();
	}
}

// Singleton instance (important for SPA consistency)
export const adController = new AdController();
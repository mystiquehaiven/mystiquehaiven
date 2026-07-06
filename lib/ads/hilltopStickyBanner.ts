const loadedZones = new Set<string>();

export function hilltopStickyBanner(adId: string) {
	if (loadedZones.has(adId)) return;

	loadedZones.add(adId);

	const script = document.createElement("script");

	script.async = true;
	script.referrerPolicy = "no-referrer-when-downgrade";

	// IMPORTANT: this is your zone loader URL
	script.src =
		"//miserly-wrap.com/bXX/VWsEd.G/lE0ZYwWGcX/SeDmN9SueZyUGlgk_PmTmcTxDOxT/gNyAMaDUkctXNTzMEF5UOyD/IdxqMewC";

	document.body.appendChild(script);
}
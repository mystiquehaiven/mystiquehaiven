const loadedZones = new Set<string>();

export function loadHilltopAd(adId: string) {
	if (loadedZones.has(adId)) return;

	loadedZones.add(adId);

	const script = document.createElement("script");

	script.async = true;
	script.referrerPolicy = "no-referrer-when-downgrade";

	// IMPORTANT: this is your zone loader URL
	script.src =
		"//miserly-wrap.com/b.XJVwsLdKG/lk0qYLWlcN/Bejmr9GuYZiUGlSk_PUTJcrxtOfTOcv1BMsT/MWtnN/ziEF5fNLzXU/xvN/wV";

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
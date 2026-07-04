export function initAds() {
	// prevent double init
	if ((window as any).__adsInitialized) return;
	(window as any).__adsInitialized = true;

	// Network 1
	const s1 = document.createElement("script");
	s1.src =
		"//miserly-wrap.com/bTX.VyszdxGdlJ0yYSW/cQ/BeQmr9puwZTURlMkkPZT-crxeOeT/EdytOcTRcqtcNMztE/5aMeTHM_wvMcQk";
	s1.async = true;
	document.head.appendChild(s1);

	// Network 2
	const s2 = document.createElement("script");
	s2.src =
		"//sturdy-prompt.com/c/DC9.6Gb/2-5VlnSnWqQ/9UNZzlEf5kM/TXU/1vMOyq0X3/MrTTkvxHN/TBUN3R";
	s2.async = true;
	document.head.appendChild(s2);
}
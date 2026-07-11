"use client";

import { useEffect, useRef } from "react";
import { loadHilltopAdInto } from "@/lib/ads/hilltop";

export default function AdSlot({
	slotId,
	zoneId,
	onImpression
}: {
	slotId: string;
	zoneId: string;
	onImpression: (slotId: string) => void;
}) {
	const ref = useRef<HTMLDivElement | null>(null);
	const hasCounted = useRef(false);
	const hasLoaded = useRef(false);

	// LOAD AD — scoped to this instance's own container
	useEffect(() => {
		const el = ref.current;
		if (!el || hasLoaded.current) return;
		hasLoaded.current = true;

		loadHilltopAdInto(el, zoneId);

		return () => {
			// clean the container on unmount so a recycled Virtuoso
			// node doesn't inherit stale ad markup from a prior instance
			el.innerHTML = "";
		};
	}, [zoneId]);

	// VIEWABILITY TRACKING (unchanged)
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (
						entry.isIntersecting &&
						entry.intersectionRatio >= 0.5 &&
						!hasCounted.current
					) {
						hasCounted.current = true;
						onImpression(slotId);
					}
				}
			},
			{ threshold: 0.5 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [slotId, onImpression]);

	return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
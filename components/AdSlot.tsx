"use client";

import { useEffect, useRef } from "react";
import { loadHilltopAd } from "@/lib/ads/hilltop";

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

	// 1. LOAD AD ONCE PER SLOT
	useEffect(() => {
		loadHilltopAd(zoneId);
	}, [zoneId]);

	// 2. VIEWABILITY TRACKING
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
						onImpression(zoneId);
					}
				}
			},
			{ threshold: 0.5 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [zoneId, onImpression]);

	return (
		<div
			ref={ref}

		/>
	);
}
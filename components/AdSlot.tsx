"use client";

import { useEffect, useRef } from "react";
import { loadHilltopAd } from "@/lib/ads/hilltop";

export default function AdSlot({
	adId,
	onImpression
}: {
	adId: string;
	onImpression: (adId: string) => void;
}) {
	const ref = useRef<HTMLDivElement | null>(null);
	const hasCounted = useRef(false);

	// 1. LOAD AD ONCE PER SLOT
	useEffect(() => {
		loadHilltopAd(adId);
	}, [adId]);

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
						onImpression(adId);
					}
				}
			},
			{ threshold: 0.5 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [adId, onImpression]);

	return (
		<div
			ref={ref}
			style={{
				minHeight: 250,
				width: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center"
			}}
		/>
	);
}
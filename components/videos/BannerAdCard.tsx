"use client";

import { useEffect, useRef } from "react";

export default function BannerAdCard({
	adId,
	isActive,
}: {
	adId: string;
	isActive: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const hasMountedRef = useRef(false);

	// Mark slot as ready (NO ad logic here)
	useEffect(() => {
		if (!containerRef.current) return;
		if (hasMountedRef.current) return;

		hasMountedRef.current = true;

		window.dispatchEvent(
			new CustomEvent("ad-slot-mounted", {
				detail: { adId },
			})
		);
	}, [adId]);

	// Visibility trigger (safe + explicit)
	useEffect(() => {
		if (!isActive) return;

		window.dispatchEvent(
			new CustomEvent("ad-slot-visible", {
				detail: { adId },
			})
		);
	}, [isActive, adId]);

	return (
		<div
			ref={containerRef}
			data-ad-slot={adId}
			className="native-ad-card"
			style={{ width: "100%", minHeight: 250 }}
		/>
	);
}
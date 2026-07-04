"use client";

import { useEffect, useRef } from "react";
import { adBus } from "../../lib/adbus";

export default function BannerAdCard({
	adId,
	isActive,
}: {
	adId: string;
	isActive: boolean;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const initializedRef = useRef(false);

	useEffect(() => {
		if (!containerRef.current) return;

		// Register this slot once
		if (!initializedRef.current) {
			initializedRef.current = true;

			adBus.subscribe(() => {
				// Tell ad network to re-scan DOM
				window.dispatchEvent(new Event("resize"));
			});
		}
	}, []);

	useEffect(() => {
		if (!isActive) return;

		// When slot becomes visible, trigger refresh
		requestAnimationFrame(() => {
			window.dispatchEvent(new Event("resize"));
		});
	}, [isActive]);

	return (
		<div
			ref={containerRef}
			data-ad-slot={adId}
			className="native-ad-card"
			style={{ width: "100%", minHeight: 250 }}
		/>
	);
}
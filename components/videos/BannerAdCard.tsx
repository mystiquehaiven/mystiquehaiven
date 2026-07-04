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
	const mountedRef = useRef(false);

	// IMPORTANT: one-time mount binding
	useEffect(() => {
		if (!containerRef.current) return;
		if (mountedRef.current) return;

		mountedRef.current = true;

		// This is the missing piece:
		// forces ad networks to "see" a fresh DOM slot
		window.dispatchEvent(new Event("resize"));
	}, []);

	// Optional visibility nudge (NOT required for rendering)
	useEffect(() => {
		if (!isActive) return;

		// small nudge only (not full refresh system)
		window.dispatchEvent(new Event("resize"));
	}, [isActive]);

	return (
		<div
			ref={containerRef}
			data-ad-slot={adId}
			className="native-ad-card"
			style={{
				width: "100%",
				minHeight: 250,
				background: "#000", // helps detect empty vs loaded
			}}
		/>
	);
}
"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface Props {
	videoId: string;
	playbackUrl: string;
	thumbnailUrl: string;
	isActive: boolean;
	isNear: boolean;
	isMuted: boolean;
  tags: string[];
  hasActiveFilters: boolean;
  isAuthenticated: boolean;
	onMuteToggle: () => void;

	// UI triggers ONLY (no modals inside)
	onOpenAdmin?: () => void;
	onOpenFilters?: () => void;
	onShare?: () => void;
	onFavorite?: () => void;

	isFavorited?: boolean;
	isAdmin?: boolean;
}

export default function VideoCard({
	videoId,
	playbackUrl,
	thumbnailUrl,
	isActive,
	isNear,
	isMuted,
	onMuteToggle,
	onOpenAdmin,
	onOpenFilters,
	onShare,
	onFavorite,
	isFavorited,
	isAdmin,
}: Props) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const hlsRef = useRef<Hls | null>(null);

	// HLS lifecycle ONLY (no UI logic here)
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (!isNear && !isActive) {
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
			video.removeAttribute("src");
			video.load();
			return;
		}

		if (hlsRef.current) return;

		if (Hls.isSupported()) {
			const hls = new Hls();
			hlsRef.current = hls;

			hls.loadSource(playbackUrl);
			hls.attachMedia(video);

			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				if (isActive) video.play().catch(() => {});
			});
		}

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
		};
	}, [isActive, isNear, playbackUrl]);

return (
	<div className="video-card">
		<video
			ref={videoRef}
			className="video"
			poster={thumbnailUrl}
			muted={isMuted}
			loop
			playsInline
		/>

		{/* ALWAYS render overlay — never conditionally mount/unmount */}
		<div className={`overlay ${isActive ? "active" : ""}`}>
			<button onClick={onMuteToggle}>
				{isMuted ? "Unmute" : "Mute"}
			</button>

			<button onClick={onShare}>
				Share
			</button>

			<button onClick={onOpenFilters}>
				Filter
			</button>

			<button onClick={onFavorite}>
				{isFavorited ? "♥" : "♡"}
			</button>

			{isAdmin && (
				<button onClick={onOpenAdmin}>
					Admin
				</button>
			)}
		</div>
	</div>
);
}
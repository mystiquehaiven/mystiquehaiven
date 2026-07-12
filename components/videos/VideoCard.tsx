"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { Volume2, VolumeX, Share2, Filter, Heart, Settings } from "lucide-react";

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
	const playPromiseRef = useRef<Promise<void> | null>(null);
	const isActiveRef = useRef(isActive);



useEffect(() => {
	isActiveRef.current = isActive;
}, [isActive]);

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
			// Use the ref, not the closed-over `isActive` — by the time
			// this fires (especially on slower mobile connections),
			// isActive may have changed since the effect was created.
			if (isActiveRef.current) {
				video.play().catch(() => {});
			}
		});
	}

	return () => {
		if (hlsRef.current) {
			hlsRef.current.destroy();
			hlsRef.current = null;
		}
	};
}, [isActive, isNear, playbackUrl]);


useEffect(() => {
	const video = videoRef.current;
	if (!video) return;

	if (isActive) {
		if (video.readyState >= 3) {
			// HAVE_FUTURE_DATA or better — safe to play now
			video.play().catch(() => {});
		}
		// If not ready, the MANIFEST_PARSED handler above (via isActiveRef)
		// will catch it once the source finishes loading.
	} else {
		video.pause();
		video.currentTime = 0;
	}
}, [isActive]);

useEffect(() => {
	const video = videoRef.current;
	if (!video) return;
	// Runs on mount (picks up current global mute state) and whenever
	// isMuted or isActive changes — keeps every card's audio in sync
	// with the global toggle without needing a manual tap per video.
	video.muted = isMuted || !isActive;
}, [isMuted, isActive]);

const handleMuteClick = () => {
	const video = videoRef.current;
	if (video) {
		// Synchronous, gesture-linked mutation — do this first,
		// before any React state update, so the browser treats
		// the unmute as a direct result of the tap.
		video.muted = !video.muted;
	}
	onMuteToggle(); // updates parent state for the icon / other cards
};

useEffect(() => {
	if (isActive) console.log(`[${videoId}] became active`);
}, [isActive, videoId]);

	return (
		<div className="video-card">
			<video
	ref={videoRef}
	className="video"
	poster={thumbnailUrl}
	loop
	playsInline
			/>

{isNear && (
	<div className={`overlay ${isNear ? "visible" : ""}`}>
<button className="control-btn" onClick={handleMuteClick} aria-label={isMuted ? "Unmute" : "Mute"}>
	{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
</button>

		<button className="control-btn" onClick={onShare} aria-label="Share">
			<Share2 size={20} />
		</button>

		<button className="control-btn" onClick={onOpenFilters} aria-label="Filter tags">
			<Filter size={20} />
		</button>

		<button className="control-btn" onClick={onFavorite} aria-label={isFavorited ? "Unfavorite" : "Favorite"}>
			<Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
		</button>

		{isAdmin && (
			<button className="control-btn" onClick={onOpenAdmin} aria-label="Admin panel">
				<Settings size={20} />
			</button>
		)}
	</div>
)}
		</div>
	);
}
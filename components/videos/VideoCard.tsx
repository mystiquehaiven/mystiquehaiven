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


	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

if (!isNear && !isActive) {
	video.pause();
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


useEffect(() => {
	const video = videoRef.current;
	if (!video) return;

	let cancelled = false;

	if (isActive) {
		// play() returns a promise (or undefined in old Safari) — capture it
		const p = video.play();
		playPromiseRef.current = p ?? null;

		if (p) {
			p.catch(() => {
				// autoplay blocked, or aborted because pause() was called
				// on this same element before play() resolved — ignore
			});
		}
	} else {
		// Wait for any in-flight play() to settle before pausing.
		// Calling pause() while play() is still pending is what throws
		// the AbortError / causes playback to "stick" in some browsers.
		Promise.resolve(playPromiseRef.current)
			.catch(() => {}) // don't let a rejected play() promise skip the pause
			.then(() => {
				if (cancelled) return; // effect cleaned up / isActive changed again
				const v = videoRef.current;
				if (v) {
					v.pause();
					v.currentTime = 0;
				}
			});
	}

	return () => {
		cancelled = true;
	};
}, [isActive]);

useEffect(() => {
	const video = videoRef.current;
	if (!video) return;
	video.muted = isMuted || !isActive
}, [isMuted]);

useEffect(() => {
	if (isActive) console.log(`[${videoId}] became active`);
}, [isActive, videoId]);

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

{isNear && (
	<div className={`overlay ${isNear ? "visible" : ""}`}>
		<button className="control-btn" onClick={onMuteToggle} aria-label={isMuted ? "Unmute" : "Mute"}>
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
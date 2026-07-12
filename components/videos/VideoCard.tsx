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
	const isMutedRef = useRef(isMuted);


useEffect(() => {
	const video = videoRef.current;
	if (!video) return;

	const attemptPlay = () => {
		if (isActiveRef.current) {
			video.muted = isMutedRef.current;
			video.play().catch(() => {});
		}
	};

	// Retry whenever the element crosses into a playable state —
	// covers the case where isActive became true before the video
	// had buffered enough data for play() to succeed.
	video.addEventListener("canplay", attemptPlay);

	return () => {
		video.removeEventListener("canplay", attemptPlay);
	};
}, []); // stable listener for the life of the component


useEffect(() => {
	isActiveRef.current = isActive;
}, [isActive]);

useEffect(() => {
	isMutedRef.current = isMuted;
}, [isMuted]);

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
	if (isActiveRef.current) {
		video.muted = isMutedRef.current;
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
		// Set muted state BEFORE calling play — don't rely on the
		// separate mute-sync effect having already run this commit.
		// Unmuted autoplay without this ordering gets silently
		// blocked by mobile browsers' autoplay policy.
		video.muted = isMuted;
		if (video.readyState >= 3) {
			video.play().catch(() => {});
		}
	} else {
		video.pause();
		video.currentTime = 0;
	}
}, [isActive, isMuted]);



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
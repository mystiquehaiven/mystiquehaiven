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

  // Single, coordinated entry point for starting playback. Every trigger
  // (canplay, MANIFEST_PARSED, isActive flipping true) calls this instead
  // of hitting video.play() directly, so there is never more than one
  // in-flight play() request racing another play()/pause() call.
  const attemptPlay = () => {
    const video = videoRef.current;
    if (!video || !isActiveRef.current) return;

    video.muted = isMutedRef.current;
    playPromiseRef.current = video
      .play()
      .catch((err: unknown) => {
        const name = (err as Error)?.name;
        // AbortError just means a pause()/load() interrupted this specific
        // request (e.g. fast scrolling) - the next trigger retries it.
        // Anything else (NotAllowedError, etc.) is worth seeing.
        if (name !== "AbortError") {
          console.warn(`[${videoId}] play() failed:`, err);
        }
      })
      .finally(() => {
        playPromiseRef.current = null;
      });
  };

  // Always wait out any in-flight play() promise before pausing. Calling
  // pause() while a play() promise is still pending is what generates the
  // AbortError in the first place - this is the actual fix for the
  // "have to scroll down then back up" symptom.
  const safePause = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // already logged in attemptPlay
      }
    }
    video.pause();
    video.currentTime = 0;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Retry whenever the element crosses into a playable state - covers
    // the case where isActive became true before the video had buffered
    // enough data for play() to succeed. Safe even though this closure is
    // captured once on mount: attemptPlay only reads from refs, so it
    // never goes stale.
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

    if (!isNear) {
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

      hls.on(Hls.Events.MANIFEST_PARSED, attemptPlay);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isNear, playbackUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Set muted state BEFORE calling play - don't rely on the separate
      // mute-sync effect having already run this commit. Unmuted autoplay
      // without this ordering gets silently blocked by mobile browsers'
      // autoplay policy.
      video.muted = isMuted;
      attemptPlay();
    } else {
      safePause();
    }
  }, [isActive, isMuted]);

  const handleMuteClick = () => {
    const video = videoRef.current;
    if (video) {
      // Synchronous, gesture-linked mutation - do this first, before any
      // React state update, so the browser treats the unmute as a direct
      // result of the tap.
      video.muted = !video.muted;
    }
    onMuteToggle(); // updates parent state for the icon / other cards
  };

  return (
    <div className="video-card">
      <video ref={videoRef} className="video" poster={thumbnailUrl} loop playsInline />

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
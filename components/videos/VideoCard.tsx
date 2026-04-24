"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Hls from "hls.js";

interface VideoCardProps {
  playbackUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
}

const HLS_CONFIG = {
  maxBufferLength: 8,
  maxMaxBufferLength: 15,
  startLevel: 0,
  abrEwmaDefaultEstimate: 2_000_000,
  enableWorker: true,
};

export default function VideoCard({
  playbackUrl,
  thumbnailUrl,
  isActive,
  isNear,
  isMuted,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const readyRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const isMutedRef = useRef(isMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    // iOS Safari — only supports fullscreen on the video element itself
    if ((video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
      return;
    }

    if (!document.fullscreenElement) {
      card.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const syncPlayback = useCallback((video: HTMLVideoElement) => {
    video.muted = isMutedRef.current;
    if (isActiveRef.current) {
      video.play().catch((err) => console.error("play failed:", err));
    } else if (!video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  }, []);

  // HLS init — runs when entering "near" range, destroyed when leaving
  useEffect(() => {
    if (!isNear && !isActive) {
      readyRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) return;

    readyRef.current = false;

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        readyRef.current = true;
        hls.startLoad(-1);
        syncPlayback(video);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) console.error("HLS fatal error:", data.type, data.details);
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      video.load();
      video.addEventListener("canplay", () => {
        readyRef.current = true;
        syncPlayback(video);
      }, { once: true });
    }

    return () => {
      readyRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isNear, isActive, playbackUrl, syncPlayback]);

  // Sync play/pause when active or mute state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !readyRef.current) return;
    syncPlayback(video);
  }, [isActive, isMuted, syncPlayback]);

  return (
    <div ref={cardRef} className="video-card" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        poster={thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none", userSelect: "none" } as React.CSSProperties}
        className="video-element"
      />

      {isActive && (
        <button
          className="fullscreen-fab"
          onClick={handleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
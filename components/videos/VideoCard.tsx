"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const hlsRef = useRef<Hls | null>(null);
  const readyRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

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
      // Fully outside the preload window — destroy and release resources
      readyRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load(); // forces browser to release buffered data
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Already initialized for this URL — don't reinitialize
    if (hlsRef.current) return;

    readyRef.current = false;

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        readyRef.current = true;
        // startLoad(-1) buffers from position 0 whether or not we're playing
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
    <div className="video-card" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        poster={thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none", userSelect: "none" } as React.CSSProperties}
        className="video-element"
      />
    </div>
  );
}
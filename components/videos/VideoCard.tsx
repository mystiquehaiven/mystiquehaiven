"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoCardProps {
  playbackUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  isNear: boolean; // within 1 slot of active — preload but don't play
  isMuted: boolean;
}

export default function VideoCard({
  playbackUrl,
  thumbnailUrl,
  isActive,
  isNear,
  isMuted,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Only initialize HLS when near or active, destroy when far away
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isNear && !isActive) {
      // Tear down if exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    // Already loaded
    if (hlsRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
    }
  }, [isActive, isNear, playbackUrl]);

  // Play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (isActive) {
      // Small delay to ensure HLS has attached
      const timer = setTimeout(() => {
        video.play().catch(() => {
          // Retry once muted if blocked
          video.muted = true;
          video.play().catch(() => {});
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (!video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [isActive, isMuted]);

  return (
    <div
      className="video-card"
      onContextMenu={(e) => e.preventDefault()}
    >
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
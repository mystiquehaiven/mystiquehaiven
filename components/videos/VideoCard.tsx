"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoCardProps {
  bunnyVideoId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  tags: string[];
  isActive: boolean;
  isMuted: boolean;
}

export default function VideoCard({
  bunnyVideoId,
  playbackUrl,
  thumbnailUrl,
  tags,
  isActive,
  isMuted,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // HLS setup — only re-runs when playbackUrl changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
    }
  }, [playbackUrl]);

  // Play/pause — re-runs when active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch((err) => console.error("play failed:", err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  // Mute sync — re-runs when mute state changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

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
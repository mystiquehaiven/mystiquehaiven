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
  

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(playbackUrl);
    hls.attachMedia(video);
    return () => hls.destroy();
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari — native HLS
    video.src = playbackUrl;
  }
}, [playbackUrl]);

  // Sync mute state independently of play state
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      className="video-card"
      onContextMenu={(e) => e.preventDefault()}
    >
<iframe
  src={`https://iframe.mediadelivery.net/embed/{libraryId}/${bunnyVideoId}?autoplay=true&loop=true&muted=true`}
  allow="autoplay"
  allowFullScreen={false}
  style={{ border: "none", width: "100%", height: "100%" }}
/>
    </div>
  );
}
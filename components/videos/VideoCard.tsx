"use client";

import { useEffect, useRef } from "react";

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
  console.log("VideoCard effect — isActive:", isActive, "video:", video);
  if (!video) return;

  video.muted = isMuted;

  if (isActive) {
    video.play().catch((err) => console.error("play failed:", err));
  } else {
    video.pause();
    video.currentTime = 0;
  }
}, [isActive, isMuted]);

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
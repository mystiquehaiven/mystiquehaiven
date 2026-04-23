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
      <video
        ref={videoRef}
        src={playbackUrl}
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
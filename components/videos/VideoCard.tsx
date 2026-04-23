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
  const isActiveRef = useRef(isActive);
  const isMutedRef = useRef(isMuted);

  // Keep refs in sync so HLS callback always sees latest values
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // HLS setup — play immediately on MANIFEST_PARSED if active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isMutedRef.current;
        if (isActiveRef.current) {
          video.play().catch((err) => console.error("play failed:", err));
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      video.addEventListener("canplay", () => {
        video.muted = isMutedRef.current;
        if (isActiveRef.current) {
          video.play().catch((err) => console.error("play failed:", err));
        }
      }, { once: true });
    }
  }, [playbackUrl]);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  if (!hlsRef.current && !video.src) return;

  video.muted = isMuted;

  if (isActive) {
    video.play().catch((err) => console.error("play failed:", err));
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
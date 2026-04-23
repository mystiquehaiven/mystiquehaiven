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
  const manifestReadyRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    manifestReadyRef.current = false;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        manifestReadyRef.current = true;
        video.muted = isMutedRef.current;
        if (isActiveRef.current) {
          video.play().catch((err) => console.error("play failed:", err));
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
        manifestReadyRef.current = false;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      video.addEventListener("canplay", () => {
        manifestReadyRef.current = true;
        video.muted = isMutedRef.current;
        if (isActiveRef.current) {
          video.play().catch((err) => console.error("play failed:", err));
        }
      }, { once: true });
    }
  }, [playbackUrl]);

  // Handle active/mute changes — also triggers play if manifest already ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (!manifestReadyRef.current) return;

    if (isActive) {
      video.play().catch((err) => console.error("play failed:", err));
    } else if (!video.paused) {
      video.pause();
      video.currentTime = 0;
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
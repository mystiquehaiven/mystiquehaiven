"use client";

import { useEffect, useRef, useState } from "react";
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
  const [ready, setReady] = useState(false);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setReady(false);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
        setReady(false);
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = playbackUrl;
      const onCanPlay = () => setReady(true);
      video.addEventListener("canplay", onCanPlay);
      return () => video.removeEventListener("canplay", onCanPlay);
    }
  }, [playbackUrl]);

  // Play/pause — only fires once stream is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    video.muted = isMuted;

    if (isActive) {
      video.play().catch((err) => console.error("play failed:", err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, ready, isMuted]);

  // Mute sync
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
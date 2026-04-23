"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoCardProps {
  playbackUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  isNear: boolean;
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
  const isActiveRef = useRef(isActive);
  const isMutedRef = useRef(isMuted);
  const isNearRef = useRef(isNear);

  // Keep refs in sync — never trigger HLS re-init
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isNearRef.current = isNear; }, [isNear]);

  // HLS init — only runs when playbackUrl changes, never on isActive/isNear changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy any existing instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) console.error("HLS fatal error:", data.type, data.details);
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      video.addEventListener("canplay", () => {
        video.muted = isMutedRef.current;
        if (isActiveRef.current) {
          video.play().catch((err) => console.error("play failed:", err));
        }
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl]); // only playbackUrl — never isActive or isNear

  // Play/pause when active state changes — only if HLS already ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsRef.current) return;

    video.muted = isMuted;

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
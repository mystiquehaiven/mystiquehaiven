"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Hls from "hls.js";
import { auth, db } from "@/lib/firebase"; // adjust to your path

interface VideoData {
  playbackUrl: string;
  thumbnailUrl?: string;
}

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;

  // Auth
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Video
  const [video, setVideo] = useState<VideoData | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Player
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Favorite
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (authReady && !uid) router.replace("/signin");
  }, [authReady, uid, router]);

// ── Fetch video via API ───────────────────────────────────────────────────
useEffect(() => {
  if (!uid || !videoId) return;
  setVideoLoading(true);

  auth.currentUser?.getIdToken().then(async (token) => {
    try {
      const res = await fetch(`/api/videos?id=${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setVideoError(true); return; }
      const data = await res.json();
      setVideo({ playbackUrl: data.playbackUrl, thumbnailUrl: data.thumbnailUrl });
    } catch {
      setVideoError(true);
    } finally {
      setVideoLoading(false);
    }
  });
}, [uid, videoId]);

// ── Fetch favorite state ──────────────────────────────────────────────────
useEffect(() => {
  if (!uid || !videoId) return;
  getDoc(doc(db, "users", uid, "favorites", videoId)).then((snap) => {
    setIsFavorited(snap.exists());
  });
}, [uid, videoId]);

  // ── HLS player setup ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!video?.playbackUrl || !videoRef.current) return;

    const videoEl = videoRef.current;

    // Tear down previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1, autoStartLoad: true });
      hls.loadSource(video.playbackUrl);
      hls.attachMedia(videoEl);
      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      videoEl.src = video.playbackUrl;
      videoEl.play().catch(() => {});
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [video?.playbackUrl]);

  // ── Fullscreen listener ───────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleFavorite = useCallback(async () => {
    if (!uid || isFavLoading) return;
    const next = !isFavorited;
    setIsFavorited(next);
    setIsFavLoading(true);
    try {
      const favRef = doc(db, "users", uid, "favorites", videoId);
      if (next) {
        await setDoc(favRef, { videoId, savedAt: serverTimestamp() });
      } else {
        await deleteDoc(favRef);
      }
    } catch {
      setIsFavorited(!next);
    } finally {
      setIsFavLoading(false);
    }
  }, [uid, isFavorited, isFavLoading, videoId]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!authReady || !uid) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Back button */}
      {!isFullscreen && (
        <button
          onClick={() => router.push("/favorites")}
          className="absolute top-5 left-5 z-30 flex items-center gap-2 text-[#e8e0d5]/40 hover:text-[#c8a97e]/80 transition-colors duration-200 group"
          aria-label="Back to favorites"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 5l-7 7 7 7" />
          </svg>
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Favorites
          </span>
        </button>
      )}

      {/* Video */}
      {videoLoading ? (
        <div className="flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-[#c8a97e]/40 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      ) : videoError ? (
        <div
          className="text-[#e8e0d5]/30 text-sm tracking-wider"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Video unavailable
        </div>
      ) : (
        <video
          ref={videoRef}
          poster={video?.thumbnailUrl}
          className="h-full w-full object-contain"
          playsInline
          loop
          muted={isMuted}
        />
      )}

      {/* FAB column — right side */}
      {!videoLoading && !videoError && (
        <div className="absolute right-5 bottom-8 z-30 flex flex-col items-center gap-3">

          {/* Favorite */}
          {uid && (
            <button
              className={`watch-fab${isFavorited ? " watch-fab--active" : ""}`}
              onClick={handleFavorite}
              disabled={isFavLoading}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorited ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}

          {/* Mute */}
          <button
            className="watch-fab"
            onClick={handleMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Fullscreen */}
          <button
            className="watch-fab"
            onClick={handleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* FAB styles */}
      <style>{`
        .watch-fab {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(232, 224, 213, 0.12);
          background: rgba(8, 8, 8, 0.5);
          backdrop-filter: blur(8px);
          color: rgba(232, 224, 213, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .watch-fab:hover {
          border-color: rgba(200, 169, 126, 0.5);
          color: rgba(200, 169, 126, 0.9);
          background: rgba(200, 169, 126, 0.06);
        }
        .watch-fab:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .watch-fab--active {
          color: #c8a97e;
          border-color: rgba(200, 169, 126, 0.5);
        }
        .watch-fab--active:hover {
          color: rgba(232, 224, 213, 0.6);
          border-color: rgba(232, 224, 213, 0.2);
        }
      `}</style>
    </div>
  );
}
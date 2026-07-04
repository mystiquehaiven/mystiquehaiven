"use client";

import { auth, db } from "@/lib/firebase";
import { PREDEFINED_TAGS } from "../../components/admin/UploadForm";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import Hls from "hls.js";

interface VideoCardProps {
  videoId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  tags: string[];
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onOpenFilter: () => void;
  hasActiveFilters: boolean;
  isAdmin?: boolean;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
  onDelete?: (videoId: string) => void;
  onTagsUpdate?: (videoId: string, tags: string[]) => void;
}

const HLS_CONFIG = {
	maxBufferLength: 4,
	maxMaxBufferLength: 8,
	backBufferLength: 0,
	startLevel: 0,
	enableWorker: true,

	// Faster adaptation for short-form content
	abrEwmaFastLive: 2,
	abrEwmaSlowLive: 5,
};

// How long a video can sit outside the near-window before we fully tear
// down its HLS instance and release the media element. Scrolling back
// into view before this fires reuses the existing instance for free;
// after it fires, coming back means a fresh manifest fetch.
const TEARDOWN_DELAY_MS = 500;

export default function VideoCard({
  videoId,
  playbackUrl,
  thumbnailUrl,
  tags: initialTags,
  isActive,
  isNear,
  isMuted,
  onMuteToggle,
  onOpenFilter,
  hasActiveFilters,
  isAdmin = false,
  isSubscribed = false,
  isAuthenticated = false,
  onDelete,
  onTagsUpdate,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const readyRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const isMutedRef = useRef(isMuted);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"idle" | "copied" | "shared">("idle");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Load favorite state from Firestore when active
  useEffect(() => {
    if (!isActive || !isAuthenticated) return;
    const user = auth.currentUser;
    if (!user) return;

    const favRef = doc(db, "users", user.uid, "favorites", videoId);
    getDoc(favRef).then((snap) => {
      setIsFavorited(snap.exists());
    }).catch(console.error);
  }, [isActive, isAuthenticated, isSubscribed, videoId]);

  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, []);

  const handleFullscreen = useCallback(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;
    if ((video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      card.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", videoId);
    const shareUrl = url.toString();
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
        setShareFeedback("shared");
      } catch {
        // user dismissed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("copied");
    }
    setTimeout(() => setShareFeedback("idle"), 2000);
  }, [videoId]);

  const handleFavorite = useCallback(async () => {
    // Unauthenticated: hide button entirely (handled in render), but guard here too
    if (!isAuthenticated) return;



    const user = auth.currentUser;
    if (!user || isFavLoading) return;

    // Optimistic toggle
    const next = !isFavorited;
    setIsFavorited(next);
    setIsFavLoading(true);

    try {
      const favRef = doc(db, "users", user.uid, "favorites", videoId);
      if (next) {
        await setDoc(favRef, {
          videoId,
          savedAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(favRef);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      // Revert on failure
      setIsFavorited(!next);
    } finally {
      setIsFavLoading(false);
    }
  }, [isAuthenticated, isSubscribed, isFavorited, isFavLoading, videoId]);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSaveTags = useCallback(async () => {
    setIsSavingTags(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error("Failed to save tags");
      onTagsUpdate?.(videoId, tags);
      setAdminPanelOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTags(false);
    }
  }, [videoId, tags, getToken, onTagsUpdate]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      onDelete?.(videoId);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  }, [videoId, getToken, onDelete]);

  const syncPlayback = useCallback((video: HTMLVideoElement) => {
    video.muted = isMutedRef.current;
    if (isActiveRef.current) {
      video.play().catch((err) => console.error("play failed:", err));
    } else if (!video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  }, []);

  // Single lifecycle effect for the HLS instance. Previously there were two
  // copies of this effect on the same deps, both independently creating and
  // tearing down hlsRef.current — harmless in the common case only because
  // the second copy's `if (hlsRef.current) return` bailed after the first
  // one ran, but the two teardown timeouts (500ms/250ms) both fired
  // independently on unload, doing duplicate work. Consolidated to one.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Outside the preload window: release the HLS instance and detach the
    // media element after a short delay, so a quick scroll-past doesn't
    // trigger a teardown/rebuild cycle.
    if (!isNear && !isActive) {
      const timeout = setTimeout(() => {
        readyRef.current = false;
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        video.pause();
        video.removeAttribute("src");
        video.load();
      }, TEARDOWN_DELAY_MS);
      return () => clearTimeout(timeout);
    }

    // Already loaded — nothing to do.
    if (hlsRef.current) return;

    readyRef.current = false;

if (Hls.isSupported()) {
  if (!isActiveRef.current) return;

  const hls = new Hls(HLS_CONFIG);
  hlsRef.current = hls;

  hls.loadSource(playbackUrl);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    readyRef.current = true;
    syncPlayback(video);
  });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (data.fatal) {
      console.error("HLS fatal error:", data.type, data.details);
    }
  });
}

    return () => {
      readyRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isNear, isActive, playbackUrl, syncPlayback]);

  return (
    <div ref={cardRef} className="video-card" onContextMenu={(e) => e.preventDefault()}>
      <video
	      preload={isActive ? "auto" : "metadata"}
        ref={videoRef}
        poster={thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none", userSelect: "none" } as React.CSSProperties}
        className="video-element"
      />

      {isActive && (
        <>
        <div className="fab-column">

          {/* Mute */}
          <button
            className="fab"
            onClick={onMuteToggle}
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

          {/* Favorite — hidden for unauthenticated users */}
          {isAuthenticated && (
            <button
              className={`fab${isFavorited ? " fab--active" : ""}`}
              onClick={handleFavorite}
              disabled={isFavLoading}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}



          {/* Share */}
          <button
            className="fab"
            onClick={handleShare}
            aria-label="Share video"
          >
            {shareFeedback === "copied" || shareFeedback === "shared" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>

          {/* Filter */}
          <button
            className={`fab${hasActiveFilters ? " fab--active" : ""}`}
            onClick={onOpenFilter}
            aria-label="Filter videos"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>

          {/* Admin */}
          {isAdmin && (
            <button
              className="fab"
              onClick={() => setAdminPanelOpen((o) => !o)}
              aria-label="Admin options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>

                    {/* Fullscreen */}
          <div className="fab-corner fab-corner--top-left">
          <button
            className="fab"
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
        </>
      )}

      {/* Admin panel */}
      {isAdmin && adminPanelOpen && (
        <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
          <div className="admin-panel-header">
            <span>Edit Video</span>
            <button onClick={() => setAdminPanelOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="admin-panel-section">
            <p className="admin-panel-label">Tags</p>
            <div className="admin-tag-grid">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`admin-tag-btn ${tags.includes(tag) ? "admin-tag-btn--active" : ""}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel-actions">
            <button onClick={handleSaveTags} disabled={isSavingTags} className="admin-save-btn">
              {isSavingTags ? "Saving…" : "Save Tags"}
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="admin-delete-btn">
              {isDeleting ? "Deleting…" : "Delete Video"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import VideoCard from "@/components/videos/VideoCard";
import "@/app/styles/videos.css";

interface Video {
  id: string;
  bunnyVideoId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string | null;
}

// ─── Upsell card ──────────────────────────────────────────────────────────────

const UPSELL_INTERVAL = 3;

function UpsellCard({ onDismiss }: { onDismiss: () => void }) {
  const router = useRouter();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        border: "0.5px solid #1a1a1a",
        position: "relative",
        padding: "3rem 2rem",
        textAlign: "center",
      }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <div
          key={c}
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            ...(c.includes("t") ? { top: "1.5rem" } : { bottom: "1.5rem" }),
            ...(c.includes("l") ? { left: "1.5rem" } : { right: "1.5rem" }),
            borderTop: c.includes("t") ? "0.5px solid #9a7c4a" : undefined,
            borderBottom: c.includes("b") ? "0.5px solid #9a7c4a" : undefined,
            borderLeft: c.includes("l") ? "0.5px solid #9a7c4a" : undefined,
            borderRight: c.includes("r") ? "0.5px solid #9a7c4a" : undefined,
            opacity: 0.6,
          }}
        />
      ))}

      <div
        style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 200,
          fontSize: "0.55rem",
          letterSpacing: "0.45em",
          color: "#2a2a2a",
          textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}
      >
        Preview Mode
      </div>

      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: "2rem",
          letterSpacing: "0.06em",
          color: "#e8e8e8",
          margin: "0 0 0.5rem",
          lineHeight: 1.1,
        }}
      >
        Unlock the Full Haven
      </h2>

      <div style={{ width: 32, height: "0.5px", background: "#9a7c4a", margin: "1.25rem auto" }} />

      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "0.95rem",
          color: "#444",
          letterSpacing: "0.04em",
          lineHeight: 1.7,
          margin: "0 0 2.5rem",
          maxWidth: 280,
        }}
      >
        You're seeing a curated preview. Subscribe for unlimited access to the full collection.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 260 }}>
        <button
          onClick={() => router.push("/subscribe")}
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: "0.6rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#080808",
            background: "#c9a96e",
            border: "none",
            padding: "0.9rem 1.5rem",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Subscribe Now
        </button>
        <button
          onClick={onDismiss}
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: "0.6rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#333",
            background: "transparent",
            border: "0.5px solid #1a1a1a",
            padding: "0.9rem 1.5rem",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Continue Preview
        </button>
      </div>
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

type FeedItem = { type: "video"; video: Video } | { type: "upsell"; key: string };

function buildFeedItems(videos: Video[]): FeedItem[] {
  const items: FeedItem[] = [];
  videos.forEach((video, i) => {
    items.push({ type: "video", video });
    if ((i + 1) % UPSELL_INTERVAL === 0 && i < videos.length - 1) {
      items.push({ type: "upsell", key: `upsell-${i}` });
    }
  });
  return items;
}

function PreviewFeed({ videos, expiresAt }: { videos: Video[]; expiresAt: number }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [dismissedUpsells, setDismissedUpsells] = useState<Set<string>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const feedListRef = useRef<HTMLDivElement>(null);

  const feedItems = buildFeedItems(videos).filter(
    (item) => item.type !== "upsell" || !dismissedUpsells.has((item as { type: "upsell"; key: string }).key)
  );

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, feedItems.length);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { root: feedListRef.current, threshold: 0.8 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [feedItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, feedItems.length - 1);
        cardRefs.current[next]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        cardRefs.current[prev]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, feedItems.length]);

  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, expiresAt - Date.now()));
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

  return (
    <div className="feed-container">
      {/* Mute FAB */}
      <button
        className="mute-fab"
        onClick={() => setIsMuted((m) => !m)}
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

      {/* Preview banner */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          background: "rgba(8,8,8,0.92)",
          borderBottom: "0.5px solid #1a1a1a",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "0.9rem",
            letterSpacing: "0.1em",
            color: "#444",
          }}
        >
          MYSTIQUE <span style={{ fontStyle: "italic", color: "#2a2a2a", fontSize: "0.8em" }}>hAIven</span>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: "0.5rem",
              letterSpacing: "0.3em",
              color: "#2a2a2a",
              textTransform: "uppercase",
            }}
          >
            Preview refreshes in {hoursLeft}h
          </span>
          <button
            onClick={() => router.push("/subscribe")}
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300,
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#080808",
              background: "#c9a96e",
              border: "none",
              padding: "0.5rem 1.25rem",
              cursor: "pointer",
            }}
          >
            Subscribe
          </button>
        </div>
      </div>

      <div
        className="feed-list"
        ref={feedListRef}
        style={{ paddingTop: "44px" }}
      >
        {feedItems.map((item, i) => (
          <div
            key={item.type === "video" ? item.video.id : item.key}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="feed-item"
          >
            {item.type === "video" ? (
              <VideoCard
                videoId={item.video.id}
                playbackUrl={item.video.playbackUrl}
                thumbnailUrl={item.video.thumbnailUrl}
                tags={item.video.tags}
                isActive={i === activeIndex}
                isNear={Math.abs(i - activeIndex) <= 1}
                isMuted={isMuted}
                isAdmin={false}
                onDelete={() => {}}
                onTagsUpdate={() => {}}
              />
            ) : (
              <UpsellCard
                onDismiss={() =>
                  setDismissedUpsells((prev) => new Set([...prev, item.key]))
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [expiresAt, setExpiresAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/signin");
        return;
      }

      setUser(u);
      const token = await u.getIdToken();

      fetch("/api/videos?feed=preview", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("fetch failed");
          return res.json();
        })
        .then((data) => {
          setVideos(data.videos);
          setExpiresAt(data.expiresAt);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-dot" />
      </div>
    );
  }

  if (!user) return null;

  if (error || videos.length === 0) {
    return (
      <div
        style={{
          background: "#080808",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "#333",
            fontSize: "1rem",
            letterSpacing: "0.05em",
          }}
        >
          Preview unavailable
        </p>
      </div>
    );
  }

  return (
    <Suspense>
      <PreviewFeed videos={videos} expiresAt={expiresAt} />
    </Suspense>
  );
}
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import VideoCard from "./VideoCard";
import TagFilterModal from "./TagFilterModel";

interface Video {
  id: string;
  bunnyVideoId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string | null;
}

interface VideoFeedProps {
  videos: Video[];
  tagCounts: Record<string, number>;
}

// REPLACED: rankVideos removed, replaced with these two
type SortMode = "random" | "newest" | "oldest";

function shuffleVideos<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function processVideos(videos: Video[], selectedTags: string[], sortMode: SortMode): Video[] {
  const filtered = selectedTags.length > 0
    ? videos.filter((v) => v.tags.some((t) => selectedTags.includes(t)))
    : videos;

  if (sortMode === "newest") {
    return [...filtered].sort((a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }
  if (sortMode === "oldest") {
    return [...filtered].sort((a, b) =>
      new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
  }
  return shuffleVideos(filtered);
}

export default function VideoFeed({ videos, tagCounts }: VideoFeedProps) {
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("random");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const feedListRef = useRef<HTMLDivElement>(null);
  const didScrollToTarget = useRef(false); // prevent re-triggering after user scrolls


  // REPLACED: filteredVideos/displayVideos replaced with memoized processVideos
  const displayVideos = useMemo(
    () => processVideos(videos, selectedTags, sortMode),
    [videos, selectedTags, sortMode]
  );

    // Scroll to shared video on first render
  useEffect(() => {
    const targetId = searchParams.get("v");
    if (!targetId || didScrollToTarget.current || displayVideos.length === 0) return;

    const index = displayVideos.findIndex((v) => v.id === targetId);
    if (index === -1) return;

    didScrollToTarget.current = true;
    setActiveIndex(index);

    // rAF ensures the feed-list items have mounted before scrolling
    requestAnimationFrame(() => {
      cardRefs.current[index]?.scrollIntoView({ behavior: "instant" });
    });
  }, [displayVideos, searchParams]);


  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, displayVideos.length);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      {
        root: feedListRef.current,
        threshold: 0.8,
      }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [displayVideos.map((v) => v.id).join(",")]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, displayVideos.length - 1);
        cardRefs.current[next]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        cardRefs.current[prev]?.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, displayVideos.length]);

  // UPDATED: now accepts and sets sortMode too
  const handleApplyTags = useCallback((tags: string[], sort: SortMode) => {
    setSelectedTags(tags);
    setSortMode(sort);
    setActiveIndex(0);
    if (feedListRef.current) {
      feedListRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="feed-container">
      {/* Mute toggle */}
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

      {/* UPDATED: passes sortMode and updated onApply signature */}
      <TagFilterModal
        selectedTags={selectedTags}
        sortMode={sortMode}
        tagCounts={tagCounts}
        onApply={handleApplyTags}
      />

      {/* Feed — UPDATED: key includes sortMode to force remount on sort change */}
      <div
        className="feed-list"
        ref={feedListRef}
        key={`${selectedTags.join(",")}-${sortMode}`}
      >
        {displayVideos.map((video, i) => (
          <div
            key={video.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="feed-item"
          >
            <VideoCard
              videoId={video.id}
              playbackUrl={video.playbackUrl}
              thumbnailUrl={video.thumbnailUrl}
              isActive={i === activeIndex}
              isNear={Math.abs(i - activeIndex) <= 1}
              isMuted={isMuted}
            />
          </div>
        ))}
      </div>

      {selectedTags.length > 0 && displayVideos.length === 0 && (
        <div className="feed-empty">no matches — showing all</div>
      )}
    </div>
  );
}
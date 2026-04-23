"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

function rankVideos(videos: Video[], selectedTags: string[]): Video[] {
  if (selectedTags.length === 0) return videos;

  return [...videos]
    .map((v) => ({
      video: v,
      matchCount: v.tags.filter((t) => selectedTags.includes(t)).length,
    }))
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(({ video }) => video);
}

export default function VideoFeed({ videos, tagCounts }: VideoFeedProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const feedListRef = useRef<HTMLDivElement>(null);

  const filteredVideos = rankVideos(videos, selectedTags);
  const displayVideos = filteredVideos.length > 0 ? filteredVideos : videos;

  // Intersection observer
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return;

    const observers: IntersectionObserver[] = [];

    cards.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= 0.5) {
            setActiveIndex(i);
          }
        },
        {
          root: feedListRef.current,
          threshold: 0.5,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [displayVideos.length]);

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

  const handleApplyTags = useCallback((tags: string[]) => {
    setSelectedTags(tags);
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

      {/* Filter button */}
      <TagFilterModal
        selectedTags={selectedTags}
        tagCounts={tagCounts}
        onApply={handleApplyTags}
      />

      {/* Feed */}
      <div className="feed-list" ref={feedListRef}>
        {displayVideos.map((video, i) => (
          <div
            key={video.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="feed-item"
          >
            <VideoCard
              playbackUrl={video.playbackUrl}
              thumbnailUrl={video.thumbnailUrl}
              isActive={i === activeIndex}
              isNear={Math.abs(i - activeIndex) <= 1}
              isMuted={isMuted}
            />
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && selectedTags.length > 0 && (
        <div className="feed-empty">no matches — showing all</div>
      )}
    </div>
  );
}
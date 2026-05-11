"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
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
  const filtered =
    selectedTags.length > 0
      ? videos.filter((v) => v.tags.some((t) => selectedTags.includes(t)))
      : videos;

  if (sortMode === "newest") {
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }
  if (sortMode === "oldest") {
    return [...filtered].sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
  }
  return shuffleVideos(filtered);
}

export default function VideoFeed({ videos: initialVideos, tagCounts }: VideoFeedProps) {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("random");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const feedListRef = useRef<HTMLDivElement>(null);
  const didScrollToTarget = useRef(false);

  // Resolve admin status and subscription from Firebase token claims
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAdmin(false);
        setIsSubscribed(false);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      const token = await user.getIdTokenResult();
      setIsAdmin(token.claims.admin === true);

      const userSnap = await getDoc(doc(db, "users", user.uid));

      const sub = userSnap.data()?.subscription as { status?: string; tier?: string } | undefined;

      setIsSubscribed(sub?.status === "active");
    });
    return unsubscribe;
  }, []);

  const handleDelete = useCallback((videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  const handleTagsUpdate = useCallback((videoId: string, tags: string[]) => {
    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, tags } : v)));
  }, []);

  const displayVideos = useMemo(
    () => processVideos(videos, selectedTags, sortMode),
    [videos, selectedTags, sortMode]
  );

  useEffect(() => {
    const targetId = searchParams.get("v");
    if (!targetId || didScrollToTarget.current || displayVideos.length === 0) return;
    const index = displayVideos.findIndex((v) => v.id === targetId);
    if (index === -1) return;
    didScrollToTarget.current = true;
    setActiveIndex(index);
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
      { root: feedListRef.current, threshold: 0.8 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [displayVideos.map((v) => v.id).join(",")]);

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

  const handleApplyTags = useCallback(
    (tags: string[], sort: SortMode) => {
      setSelectedTags(tags);
      setSortMode(sort);
      setActiveIndex(0);
      if (feedListRef.current) {
        feedListRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    []
  );

  return (
    <div className="feed-container">
      {/* TagFilterModal is kept here but triggered from VideoCard via onOpenFilter */}
      <TagFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        selectedTags={selectedTags}
        sortMode={sortMode}
        tagCounts={tagCounts}
        onApply={handleApplyTags}
      />

      <div
        className="feed-list"
        ref={feedListRef}
        key={`${selectedTags.join(",")}-${sortMode}`}
      >
        {displayVideos.map((video, i) => (
          <div
            key={video.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="feed-item"
          >
            <VideoCard
              videoId={video.id}
              playbackUrl={video.playbackUrl}
              thumbnailUrl={video.thumbnailUrl}
              tags={video.tags}
              isActive={i === activeIndex}
              isNear={Math.abs(i - activeIndex) <= 1}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted((m) => !m)}
              onOpenFilter={() => setFilterModalOpen(true)}
              hasActiveFilters={selectedTags.length > 0}
              isAdmin={isAdmin}
              isSubscribed={isSubscribed}
              isAuthenticated={isAuthenticated}
              onDelete={handleDelete}
              onTagsUpdate={handleTagsUpdate}
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
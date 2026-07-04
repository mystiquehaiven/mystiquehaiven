"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import VideoCard from "./VideoCard";
import TagFilterModal from "./TagFilterModel";
import BannerAdCard from "./BannerAdCard";
import { adBus } from "../../lib/adbus";

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

// One ad slot inserted after every N videos. Tune based on RPM vs retention —
// start conservative (e.g. 6-8) and watch session length before tightening it.
const AD_INTERVAL = 6;

type FeedItem =
  | { kind: "video"; video: Video }
  | { kind: "ad"; adId: string };



function shuffleVideos<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Ad IDs are anchored to the video that precedes the slot, not to array
// position. That way an edit/delete elsewhere in the feed doesn't relabel
// every ad slot after it and force BannerAdCard to remount.
function buildFeedItems(videos: Video[]): FeedItem[] {
  const items: FeedItem[] = [];
  videos.forEach((video, i) => {
    items.push({ kind: "video", video });
    const isLast = i === videos.length - 1;
    if (!isLast && (i + 1) % AD_INTERVAL === 0) {
      items.push({ kind: "ad", adId: `ad-after-${video.id}` });
    }
  });
  return items;
}



export default function VideoFeed({ videos: initialVideos, tagCounts }: VideoFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  });
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const feedListRef = useRef<HTMLDivElement>(null);
  const didScrollToTarget = useRef(false);

  // Holds the last random order we computed, keyed by the *set* of video ids
  // it was computed from. Only recomputed when that set actually changes —
  // not when an unrelated field (tags, etc.) on one of the videos changes.
  // This is what stops "edit a tag" from silently reshuffling everyone's
  // random-mode feed and desyncing ad slots / IntersectionObserver targets.
  const shuffleOrderRef = useRef<{ key: string; order: string[] } | null>(null);

  



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

  const displayVideos = useMemo(() => {
    const filtered =
      selectedTags.length > 0
        ? videos.filter((v) => {
            const videoTagsLower = v.tags.map((t) => t.toLowerCase());
            return selectedTags.every((t) => videoTagsLower.includes(t.toLowerCase()));
          })
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

    // random — only reshuffle when the underlying id set changes (filter
    // applied/cleared, video added/removed). A tag edit on an existing
    // video doesn't change this key, so order is preserved across it.
    const idKey = filtered
      .map((v) => v.id)
      .sort()
      .join(",");

    if (!shuffleOrderRef.current || shuffleOrderRef.current.key !== idKey) {
      shuffleOrderRef.current = {
        key: idKey,
        order: shuffleVideos(filtered).map((v) => v.id),
      };
    }

    const byId = new Map(filtered.map((v) => [v.id, v]));
    return shuffleOrderRef.current.order
      .map((id) => byId.get(id))
      .filter((v): v is Video => Boolean(v));
  }, [videos, selectedTags, sortMode]);

  // Combined video+ad list — everything below (refs, observer, keyboard nav)
  // indexes against THIS array, not displayVideos, so ad slots don't desync
  // scroll/active-state tracking.
  const feedItems = useMemo(() => buildFeedItems(displayVideos), [displayVideos]);

  useEffect(() => {
	  adBus.refresh();
  }, [feedItems]);

  useEffect(() => {
    const targetId = searchParams.get("v");
    if (!targetId || didScrollToTarget.current || feedItems.length === 0) return;
    const index = feedItems.findIndex(
      (item) => item.kind === "video" && item.video.id === targetId
    );
    if (index === -1) return;
    didScrollToTarget.current = true;
    setActiveIndex(index);
    requestAnimationFrame(() => {
      cardRefs.current[index]?.scrollIntoView({ behavior: "instant" });
    });
  }, [feedItems, searchParams]);

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
  }, [feedItems.map((item) => (item.kind === "video" ? item.video.id : item.adId)).join(",")]);

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

  const handleApplyTags = useCallback(
    (tags: string[], sort: SortMode) => {
      setSelectedTags(tags);
      setSortMode(sort);
      setActiveIndex(0);
      if (feedListRef.current) {
        feedListRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }

      const params = new URLSearchParams(searchParams.toString());
      if (tags.length > 0) {
        params.set("tags", tags.join(","));
      } else {
        params.delete("tags");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="feed-container">
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
        {feedItems.map((item, i) => (
          <div
            key={item.kind === "video" ? item.video.id : item.adId}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="feed-item"
          >
            {item.kind === "video" ? (
              <VideoCard
                videoId={item.video.id}
                playbackUrl={item.video.playbackUrl}
                thumbnailUrl={item.video.thumbnailUrl}
                tags={item.video.tags}
                isActive={Math.abs(i - activeIndex) <= 1}
                isNear={i === activeIndex || i === activeIndex + 1}
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
            ) : (
              <BannerAdCard adId={item.adId} isActive={i === activeIndex} />
            )}
          </div>
        ))}
      </div>

      {selectedTags.length > 0 && displayVideos.length === 0 && (
        <div className="feed-empty">no matches — showing all</div>
      )}
    </div>
  );
}
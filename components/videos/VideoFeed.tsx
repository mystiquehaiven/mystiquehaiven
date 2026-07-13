"use client";

import {
	useEffect,
	useRef,
	useState,
	useCallback,
	useMemo
} from "react";

import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, getDoc, getDocs, collection, updateDoc, deleteDoc, setDoc, serverTimestamp, arrayRemove } from "firebase/firestore";
import AdminPanelModal from "../admin/AdminPanelModel";
import { db, auth } from "@/lib/firebase";
import VideoCard from "./VideoCard";
import TagFilterModal from "./TagFilterModel";
import { useAuth } from "@/context/AuthContext";

import { AD_CONFIG } from "@/lib/ads/adConfig";
import AdSlot from "../AdSlot";

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
	isAuthenticated: boolean;
	userId: string | null;
}

type SortMode = "random" | "newest" | "oldest";

const AD_INTERVAL = 6;

type FeedItem =
	| { kind: "video"; video: Video }
	| { kind: "ad"; adId: string; zoneId: string };

function shuffleVideos<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

const AD_ZONES = ["in-page-1", "in-page-2", "in-page-3", "in-page-4", "in-page-5", "in-page-6", "in-page-7", "in-page-8", "in-page-9", "in-page-10"];

function buildFeedItems(videos: Video[]): FeedItem[] {
	const items: FeedItem[] = [];
	let adCount = 0;

	videos.forEach((video, i) => {
		items.push({ kind: "video", video });

		const isLast = i === videos.length - 1;
		if (!isLast && (i + 1) % AD_INTERVAL === 0) {
			items.push({
				kind: "ad",
				adId: `ad-after-${video.id}`,
				zoneId: AD_ZONES[adCount % AD_ZONES.length],
			});
			adCount++;
		}
	});

	return items;
}

const adRegistry = new Map<
	string,
	{
		impressions: number;
		lastImpressionAt: number;
		status: "idle" | "loading" | "filled" | "empty";
    viewed: boolean;
	}
>();

function getOrCreateAdSlot(adId: string) {
	if (!adRegistry.has(adId)) {
		adRegistry.set(adId, {
			impressions: 0,
			lastImpressionAt: 0,
			status: "idle",
      viewed: false
		});
	}

	return adRegistry.get(adId)!;
}

function evaluateAdVisibility(
	feedItems: FeedItem[],
	range: { startIndex: number; endIndex: number }
) {
	const now = Date.now();
	const rangeKey = getRangeKey(range);

	for (let i = range.startIndex; i <= range.endIndex; i++) {
		const item = feedItems[i];
		if (!item || item.kind !== "ad") continue;

		const adId = item.adId;

		const slot = getOrCreateAdSlot(adId);

		const guard = adRequestGuard.get(adId);

		// -----------------------------
		// 1. RANGE DEDUPE (core fix)
		// -----------------------------
		if (guard?.lastRangeKey === rangeKey) {
			continue; // already evaluated in this viewport window
		}

		// -----------------------------
		// 2. COOLDOWN (CPM protection)
		// -----------------------------
		const COOLDOWN = 60_000;
		if (now - slot.lastImpressionAt < COOLDOWN) continue;

		// -----------------------------
		// 3. NETWORK IN FLIGHT GUARD
		// -----------------------------
		if (slot.status === "loading") continue;

		// -----------------------------
		// UPDATE GUARD IMMEDIATELY (prevents double triggers in same frame)
		// -----------------------------
		adRequestGuard.set(adId, {
			lastRequestedAt: now,
			lastRangeKey: rangeKey
		});

		triggerAdFill(adId, slot);
	}
}

async function triggerAdFill(adId: string, slot: any) {
	slot.status = "loading";

	try {
		// later: real ad request logic here (NOT impressions)

		slot.status = "filled";
	} catch {
		slot.status = "empty";
	}
}

const adRequestGuard = new Map<
	string,
	{
		lastRequestedAt: number;
		lastRangeKey: string;
	}
>();

function getRangeKey(range: { startIndex: number; endIndex: number }) {
	return `${range.startIndex}-${range.endIndex}`;
}

export default function VideoFeed({
	videos: initialVideos,
	tagCounts
}: VideoFeedProps) {
  const activeIndexRef = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const virtuosoRef = useRef<VirtuosoHandle>(null);

	const [videos, setVideos] = useState<Video[]>(initialVideos);
	const [activeIndex, setActiveIndex] = useState(0);

	const { user, loading: authLoading, isAdmin } = useAuth();
	const isAuthenticated = !!user;
	

	const [selectedTags, setSelectedTags] = useState<string[]>(() => {
		const tagsParam = searchParams.get("tags");
		return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
	});

	const [sortMode, setSortMode] = useState<SortMode>("newest");
	const [isMuted, setIsMuted] = useState(true);
	const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [adminTags, setAdminTags] = useState<string[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  // Latest range reported by Virtuoso, and whether it's currently mid-scroll.
  // activeIndex is committed either immediately (discrete, non-scrolling
  // range change) or the moment isScrolling reports false (real scroll-end) -
  // never on a guessed timeout, which lingering momentum scroll can reset
  // indefinitely.
  const pendingIndexRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

	const shuffleOrderRef = useRef<{
		key: string;
		order: string[];
	} | null>(null);

  const isNavigatingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  

const navigateToIndex = useCallback((index: number, behavior: "auto" | "smooth" = "auto") => {
	if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);

	isNavigatingRef.current = true;
	activeIndexRef.current = index; // sync immediately, don't wait for the effect
	setActiveIndex(index);

	virtuosoRef.current?.scrollToIndex({ index, behavior });

	navigationTimeoutRef.current = setTimeout(() => {
		isNavigatingRef.current = false;
	}, 300);
}, []);

  useEffect(() => {
	if (typeof window === "undefined") return;

	window.history.scrollRestoration = "manual";
}, []);

useEffect(() => {
	activeIndexRef.current = activeIndex;
}, [activeIndex]);

	// ---------------- AUTH ----------------
useEffect(() => {
  if (!user) {
    setFavoritedIds([]);
    return;
  }

  (async () => {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.data();

    const favSnap = await getDocs(collection(db, "users", user.uid, "favorites"));
    setFavoritedIds(favSnap.docs.map((d) => d.id));
  })();
}, [user]);

	// ---------------- CRUD ----------------
	const handleDelete = useCallback((videoId: string) => {
		setVideos((prev) => prev.filter((v) => v.id !== videoId));
	}, []);

	const handleTagsUpdate = useCallback(
		(videoId: string, tags: string[]) => {
			setVideos((prev) =>
				prev.map((v) => (v.id === videoId ? { ...v, tags } : v))
			);
		},
		[]
	);

const handleFavoriteToggle = useCallback(async (videoId: string) => {
	const user = auth.currentUser;
	if (!user) return;

	const isFav = favoritedIds.includes(videoId);
	setFavoritedIds((prev) =>
		isFav ? prev.filter((id) => id !== videoId) : [...prev, videoId]
	);

	const favDocRef = doc(db, "users", user.uid, "favorites", videoId);

	try {
		if (isFav) {
			await deleteDoc(favDocRef);
		} else {
			await setDoc(favDocRef, { savedAt: serverTimestamp() });
		}
	} catch (err) {
		console.error("Failed to update favorite:", err);
		setFavoritedIds((prev) =>
			isFav ? [...prev, videoId] : prev.filter((id) => id !== videoId)
		);
	}
}, [favoritedIds]);

const handleToggleAdminTag = useCallback((tag: string) => {
	setAdminTags((prev) =>
		prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
	);
}, []);

const handleSaveTags = useCallback(async () => {
	if (!selectedVideoId) return;
	setIsSavingTags(true);
	try {
		await updateDoc(doc(db, "videos", selectedVideoId), { tags: adminTags });
		handleTagsUpdate(selectedVideoId, adminTags);
		setAdminModalOpen(false);
	} catch (err) {
		console.error("Failed to save tags:", err);
	} finally {
		setIsSavingTags(false);
	}
}, [selectedVideoId, adminTags, handleTagsUpdate]);

const handleDeleteVideo = useCallback(async () => {
	if (!selectedVideoId) return;
	setIsDeletingVideo(true);
	try {
		const token = await auth.currentUser?.getIdToken();
		if (!token) throw new Error("Not authenticated");

		const res = await fetch("/api/admin/delete-video", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ videoId: selectedVideoId }),
		});

		if (!res.ok) {
			const { error } = await res.json().catch(() => ({}));
			throw new Error(error || `Delete failed (${res.status})`);
		}

		handleDelete(selectedVideoId);
		setAdminModalOpen(false);
	} catch (err) {
		console.error("Failed to delete video:", err);
	} finally {
		setIsDeletingVideo(false);
	}
}, [selectedVideoId, handleDelete]);

	// ---------------- FILTER + SORT ----------------
	const displayVideos = useMemo(() => {
		const filtered =
			selectedTags.length > 0
				? videos.filter((v) =>
						selectedTags.every((t) =>
							v.tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())
						)
					)
				: videos;

		if (sortMode === "newest") {
			return [...filtered].sort(
				(a, b) =>
					new Date(b.createdAt ?? 0).getTime() -
					new Date(a.createdAt ?? 0).getTime()
			);
		}

		if (sortMode === "oldest") {
			return [...filtered].sort(
				(a, b) =>
					new Date(a.createdAt ?? 0).getTime() -
					new Date(b.createdAt ?? 0).getTime()
			);
		}

		// random stable shuffle
		const idKey = filtered.map((v) => v.id).sort().join(",");

		if (
			!shuffleOrderRef.current ||
			shuffleOrderRef.current.key !== idKey
		) {
			shuffleOrderRef.current = {
				key: idKey,
				order: shuffleVideos(filtered).map((v) => v.id)
			};
		}

		const byId = new Map(filtered.map((v) => [v.id, v]));
		return shuffleOrderRef.current.order
			.map((id) => byId.get(id))
			.filter(Boolean) as Video[];
	}, [videos, selectedTags, sortMode]);

	const feedItems = useMemo(
		() => buildFeedItems(displayVideos),
		[displayVideos]
	);

	// ---------------- AD VISIBILITY + ACTIVE INDEX (Virtuoso-native) ----------------
	// Virtuoso can fire rangeChanged repeatedly during a single momentum/snap
	// scroll, each call superseding the last. A fixed debounce window can get
	// reset indefinitely by trailing scroll events, so instead: always record
	// the latest range, and only commit activeIndex once Virtuoso itself
	// confirms scrolling has stopped (or immediately, if nothing is scrolling
	// at all - e.g. a single discrete snap that never triggers isScrolling).
	const handleRangeChanged = useCallback((range: { startIndex: number; endIndex: number }) => {
		evaluateAdVisibility(feedItems, range);
		pendingIndexRef.current = range.startIndex;

		if (isNavigatingRef.current) return;

		if (!isScrollingRef.current) {
			setActiveIndex(range.startIndex);
		}
	}, [feedItems]);

	const handleIsScrolling = useCallback((scrolling: boolean) => {
		isScrollingRef.current = scrolling;

		if (!scrolling && !isNavigatingRef.current && pendingIndexRef.current !== null) {
			setActiveIndex(pendingIndexRef.current);
		}
	}, []);



	// ---------------- KEYBOARD NAV ----------------
useEffect(() => {
	const onKeyDown = (e: KeyboardEvent) => {
		if (!virtuosoRef.current) return;

		if (e.key === "ArrowDown") {
	e.preventDefault();
	const next = Math.min(activeIndexRef.current + 1, feedItems.length - 1);
	navigateToIndex(next);
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			const next = Math.max(activeIndexRef.current - 1, 0);
			navigateToIndex(next);
		}
	};

	window.addEventListener("keydown", onKeyDown);
	return () => window.removeEventListener("keydown", onKeyDown);
}, [feedItems.length, navigateToIndex]);

	// ---------------- URL SCROLL TARGET ----------------
	useEffect(() => {
		const targetId = searchParams.get("v");
		if (!targetId) return;

		const index = feedItems.findIndex(
			(i) => i.kind === "video" && i.video.id === targetId
		);

		if (index === -1) return;

		setActiveIndex(index);

		virtuosoRef.current?.scrollToIndex({
			index,
			behavior: "auto"
		});
	}, [feedItems, searchParams]);

	// ---------------- TAG APPLY ----------------
	const handleApplyTags = useCallback(
		(tags: string[], sort: SortMode) => {
			setSelectedTags(tags);
			setSortMode(sort);
			setActiveIndex(0);

			virtuosoRef.current?.scrollToIndex({
				index: 0,
				behavior: "smooth"
			});

			const params = new URLSearchParams(searchParams.toString());

			if (tags.length) params.set("tags", tags.join(","));
			else params.delete("tags");

			router.replace(
				params.toString()
					? `${pathname}?${params}`
					: pathname,
				{ scroll: false }
			);
		},
		[pathname, router, searchParams]
	);

	// ---------------- RENDER ----------------
return (
	<div className="feed-container">

		{/* GLOBAL MODAL LAYER (DO NOT MOVE INSIDE VIRTUOSO) */}
		<TagFilterModal
			isOpen={filterModalOpen}
			onClose={() => setFilterModalOpen(false)}
			selectedTags={selectedTags}
			sortMode={sortMode}
			tagCounts={tagCounts}
			onApply={handleApplyTags}
		/>

    <AdminPanelModal
	    open={adminModalOpen}
	    onClose={() => setAdminModalOpen(false)}
	    tags={adminTags}
	    onToggleTag={handleToggleAdminTag}
	    onSave={handleSaveTags}
	    onDelete={handleDeleteVideo}
	    isSaving={isSavingTags}
	    isDeleting={isDeletingVideo}
	    isAdmin={isAdmin}
    />


		{/* VIEWPORT WRAPPER */}
		<div className="feed-viewport">

			<Virtuoso
        overscan={{ main: 2, reverse: 2 }}
				ref={virtuosoRef}
				data={feedItems}
				rangeChanged={handleRangeChanged}
				isScrolling={handleIsScrolling}
				style={{ height: "100%", width: "100%" }}
        className="snap-feed"
				itemContent={(index, item: FeedItem) => {

					/* ---------------- ADS ---------------- */
					if (item.kind === "ad") {
						return (
		          <div style={{ width: "100%", 
								height: "100svh",
								scrollSnapAlign: "start",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								contain: "layout size", }}>

            
{!isAdmin && (
  <div style={{ width: "100%", height: "250px" }}>
    <AdSlot
      slotId={item.adId}
      zoneId={item.zoneId}
      onImpression={(slotId) => {
        const slot = getOrCreateAdSlot(slotId);

        slot.impressions += 1;
        slot.lastImpressionAt = Date.now();
        slot.viewed = true;

        window.dispatchEvent(
          new CustomEvent("ad-impression", {
            detail: { adId: slotId }
          })
        );
      }}
    />
  </div>
)}

              </div>
						);
					}

					/* ---------------- VIDEO ---------------- */
					const isMounted = Math.abs(index - activeIndex) <= 1; // wide — for isNear
					const isPlaying = index === activeIndex;

					return (
	<div style={{ width: "100%", height: "100svh", scrollSnapAlign: "start", }}>
		<VideoCard
			videoId={item.video.id}
			playbackUrl={item.video.playbackUrl}
			thumbnailUrl={item.video.thumbnailUrl}
			tags={item.video.tags}
			isActive={isPlaying}
			isNear={isMounted}
			isMuted={isMuted}
			onMuteToggle={() => setIsMuted((m) => !m)}
			onOpenFilters={() => setFilterModalOpen(true)}
			hasActiveFilters={selectedTags.length > 0}
			isAdmin={isAdmin}
			isAuthenticated={isAuthenticated}
      onOpenAdmin={() => {
      console.log("admin trigger clicked");
	    setSelectedVideoId(item.video.id);
	    setAdminTags(item.video.tags);
	    setAdminModalOpen(true);
        }}
      onFavorite={() => handleFavoriteToggle(item.video.id)}
      isFavorited={favoritedIds.includes(item.video.id)}
		/>
	</div>
					);
				}}
			/>

		</div>
	</div>
);
}
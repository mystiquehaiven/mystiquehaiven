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
import { doc, getDoc } from "firebase/firestore";

import { db, auth } from "@/lib/firebase";
import VideoCard from "./VideoCard";
import TagFilterModal from "./TagFilterModel";

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
	| { kind: "ad"; adId: string };

function shuffleVideos<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function buildFeedItems(videos: Video[]): FeedItem[] {
	const items: FeedItem[] = [];

	videos.forEach((video, i) => {
		items.push({ kind: "video", video });

		const isLast = i === videos.length - 1;
		if (!isLast && (i + 1) % AD_INTERVAL === 0) {
			items.push({
				kind: "ad",
				adId: `ad-after-${video.id}`
			});
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
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const virtuosoRef = useRef<VirtuosoHandle>(null);

	const [videos, setVideos] = useState<Video[]>(initialVideos);
	const [activeIndex, setActiveIndex] = useState(0);

	const [isAdmin, setIsAdmin] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const [selectedTags, setSelectedTags] = useState<string[]>(() => {
		const tagsParam = searchParams.get("tags");
		return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
	});

	const [sortMode, setSortMode] = useState<SortMode>("newest");
	const [isMuted, setIsMuted] = useState(true);
	const [filterModalOpen, setFilterModalOpen] = useState(false);

	const shuffleOrderRef = useRef<{
		key: string;
		order: string[];
	} | null>(null);

	// ---------------- AUTH ----------------
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
			const sub = userSnap.data()?.subscription;

			setIsSubscribed(sub?.status === "active");
		});

		return unsubscribe;
	}, []);

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

	// ---------------- AD VISIBILITY (Virtuoso-native) ----------------
const handleRangeChanged = useCallback((range: any) => {
	evaluateAdVisibility(feedItems, range);
}, [feedItems]);

	// ---------------- KEYBOARD NAV ----------------
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!virtuosoRef.current) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				const next = Math.min(
					activeIndex + 1,
					feedItems.length - 1
				);
				virtuosoRef.current.scrollToIndex({
					index: next,
					behavior: "smooth"
				});
				setActiveIndex(next);
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				const prev = Math.max(activeIndex - 1, 0);
				virtuosoRef.current.scrollToIndex({
					index: prev,
					behavior: "smooth"
				});
				setActiveIndex(prev);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [activeIndex, feedItems.length]);

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
			<TagFilterModal
				isOpen={filterModalOpen}
				onClose={() => setFilterModalOpen(false)}
				selectedTags={selectedTags}
				sortMode={sortMode}
				tagCounts={tagCounts}
				onApply={handleApplyTags}
			/>

			<Virtuoso
				ref={virtuosoRef}
				data={feedItems}
				useWindowScroll
				rangeChanged={handleRangeChanged}
				itemContent={(index, item: FeedItem) => {
if (item.kind === "ad") {
	return (
		<AdSlot
			adId={item.adId}
			onImpression={(adId) => {
				const slot = getOrCreateAdSlot(adId);

				slot.impressions += 1;
				slot.lastImpressionAt = Date.now();
				slot.viewed = true;

				window.dispatchEvent(
					new CustomEvent("ad-impression", {
						detail: { adId }
					})
				);
			}}
		/>
	);
}

					const isActive = Math.abs(index - activeIndex) <= 1;

					return (
						<VideoCard
							videoId={item.video.id}
							playbackUrl={item.video.playbackUrl}
							thumbnailUrl={item.video.thumbnailUrl}
							tags={item.video.tags}
							isActive={isActive}
							isNear={index === activeIndex}
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
					);
				}}
			/>
		</div>
	);
}
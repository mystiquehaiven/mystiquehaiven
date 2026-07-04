"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import VideoFeed from "@/components/videos/VideoFeed";
import "../styles/videos.css";

interface Video {
	id: string;
	bunnyVideoId: string;
	playbackUrl: string;
	thumbnailUrl: string;
	tags: string[];
	createdAt: string | null;
}

export default function VideosPage() {
	const [user, setUser] = useState<User | null>(null);
	const [videos, setVideos] = useState<Video[]>([]);
	const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Track auth state only (no gating)
		const unsubscribe = onAuthStateChanged(auth, async (u) => {
			setUser(u);

			// fetch feed regardless of auth
			try {
				const token = u ? await u.getIdToken() : null;

				const res = await fetch("/api/videos?feed=general", {
					headers: token
						? { Authorization: `Bearer ${token}` }
						: {},
				});

				if (res.ok) {
					const data = await res.json();
					setVideos(data.videos);

					const counts: Record<string, number> = {};
					for (const video of data.videos) {
						for (const tag of video.tags ?? []) {
							counts[tag] = (counts[tag] ?? 0) + 1;
						}
					}
					setTagCounts(counts);
				}
			} catch (err) {
				console.error("Failed to load videos:", err);
			}

			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	if (loading) {
		return (
			<div className="loading-screen">
				<span className="loading-dot" />
			</div>
		);
	}

	return (
		<Suspense>
      <VideoFeed
	      videos={videos}
	      tagCounts={tagCounts}
	      userId={user?.uid ?? null}
	      isAuthenticated={!!user}
      />
		</Suspense>
	);
}
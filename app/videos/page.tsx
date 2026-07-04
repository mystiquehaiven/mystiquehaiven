"use client";

import { useEffect, useState, Suspense } from "react";
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
	const [videos, setVideos] = useState<Video[]>([]);
	const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadVideos() {
			try {
				const res = await fetch("/api/videos?feed=general");

				if (!res.ok) throw new Error("Failed to fetch");

				const data = await res.json();
				setVideos(data.videos);

				const counts: Record<string, number> = {};
				for (const video of data.videos) {
					for (const tag of video.tags ?? []) {
						counts[tag] = (counts[tag] ?? 0) + 1;
					}
				}
				setTagCounts(counts);
			} catch (err) {
				console.error("Failed to load videos:", err);
			} finally {
				setLoading(false);
			}
		}

		loadVideos();
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
				userId={null}
				isAuthenticated={false}
			/>
		</Suspense>
	);
}
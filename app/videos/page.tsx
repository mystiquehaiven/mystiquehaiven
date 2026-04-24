"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import VideoFeed from "@/components/videos/VideoFeed";
import "../styles/videos.css"

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
  const router = useRouter();

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    if (!u) {
      router.replace("/signin");
      return;
    }

    setUser(u);
    const token = await u.getIdToken();

    const res = await fetch("/api/videos", { headers: { Authorization: `Bearer ${token}` } });

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

    setLoading(false);
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

  return <VideoFeed videos={videos} tagCounts={tagCounts} />;
}
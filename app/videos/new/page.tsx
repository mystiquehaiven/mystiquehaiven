"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import VideoFeed from "@/components/videos/VideoFeed";
import "../../styles/videos.css";

interface Video {
  id: string;
  bunnyVideoId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string | null;
}

export default function NewVideosPage() {
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

      // Check exclusive tier before fetching
      const userDoc = await getDoc(doc(db, "users", u.uid));
      const userData = userDoc.data();
      const isExclusive =
        userData?.subscriptionTier === "exclusive" &&
        userData?.subscriptionStatus === "active";

      if (!isExclusive) {
        router.replace("/profile");
        return;
      }

      setUser(u);
      const token = await u.getIdToken();

      const res = await fetch("/api/videos?feed=new", {
        headers: { Authorization: `Bearer ${token}` },
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
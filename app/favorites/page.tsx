"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase"; // adjust to your import path
import Footer from "../../components/footer"; // adjust to your import path

const BUNNY_BASE = "https://vz-53bf2ade-7e4.b-cdn.net";
const PAGE_SIZE = 24;

interface FavoriteItem {
  videoId: string;
  savedAt: { seconds: number } | null;
}

function thumbnailUrl(videoId: string) {
  return `${BUNNY_BASE}/${videoId}/thumbnail.jpg`;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Redirect if not signed in
  useEffect(() => {
    if (authReady && !uid) router.replace("/signin");
  }, [authReady, uid, router]);

  const fetchPage = useCallback(
    async (after: DocumentSnapshot | null) => {
      if (!uid) return;

      const favRef = collection(db, "users", uid, "favorites");
      const q = after
        ? query(favRef, orderBy("savedAt", "desc"), startAfter(after), limit(PAGE_SIZE))
        : query(favRef, orderBy("savedAt", "desc"), limit(PAGE_SIZE));

      const snap = await getDocs(q);

      const newItems: FavoriteItem[] = snap.docs.map((d) => ({
        videoId: d.id,
        savedAt: d.data().savedAt ?? null,
      }));

      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHasMore(snap.docs.length === PAGE_SIZE);
      return newItems;
    },
    [uid]
  );

  // Initial load
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    fetchPage(null).then((data) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, [uid, fetchPage]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          fetchPage(lastDocRef.current).then((data) => {
            if (data) setItems((prev) => [...prev, ...data]);
            setLoadingMore(false);
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchPage]);

  if (!authReady || (!uid && authReady)) return null;

  return (
    <div
      className="min-h-screen bg-[#080808] text-[#e8e0d5]"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(200,169,126,0.07),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#c8a97e]/60 uppercase mb-3">
            Collection
          </p>
          <h1 className="text-4xl font-light tracking-wide text-[#e8e0d5]">
            Favorites
          </h1>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-[#c8a97e]/40 to-transparent" />
          <div className="w-1 h-1 rounded-full bg-[#c8a97e]/60" />
          <div className="flex-1 h-px bg-gradient-to-l from-[#c8a97e]/40 to-transparent" />
        </div>

        {/* States */}
        {loading ? (
          <LoadingGrid />
        ) : items.length === 0 ? (
          <EmptyState onBrowse={() => router.push("/videos")} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item) => (
                <ThumbnailCard
                  key={item.videoId}
                  videoId={item.videoId}
                  onClick={() => router.push(`/watch/${item.videoId}`)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-12 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-3 text-[#c8a97e]/40">
                    <span className="text-xs tracking-[0.3em] uppercase">Loading</span>
                    <LoadingDots />
                  </div>
                )}
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="mt-16 flex items-center gap-4">
                <div className="flex-1 h-px bg-[#e8e0d5]/5" />
                <p className="text-[10px] tracking-[0.3em] text-[#e8e0d5]/20 uppercase">
                  {items.length} saved
                </p>
                <div className="flex-1 h-px bg-[#e8e0d5]/5" />
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

// --- Sub-components ---

function ThumbnailCard({
  videoId,
  onClick,
}: {
  videoId: string;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[9/16] overflow-hidden border border-[#e8e0d5]/5 hover:border-[#c8a97e]/30 transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c8a97e]/50"
    >
      {imgError ? (
        <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
          <span className="text-[#e8e0d5]/10 text-xs tracking-widest uppercase">
            No preview
          </span>
        </div>
      ) : (
        <img
          src={thumbnailUrl(videoId)}
          alt=""
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Play indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-10 h-10 rounded-full border border-[#c8a97e]/60 flex items-center justify-center backdrop-blur-sm bg-[#080808]/30">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-[#c8a97e] translate-x-0.5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] bg-[#111] border border-[#e8e0d5]/5 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="py-24 flex flex-col items-center text-center">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 w-16 h-px bg-gradient-to-r from-transparent to-[#c8a97e]/30" />
        <div className="w-1 h-1 rounded-full bg-[#c8a97e]/40" />
        <div className="flex-1 w-16 h-px bg-gradient-to-l from-transparent to-[#c8a97e]/30" />
      </div>
      <p className="text-sm text-[#e8e0d5]/30 tracking-wider mb-1">
        Nothing saved yet
      </p>
      <p className="text-xs text-[#e8e0d5]/15 tracking-wide mb-10">
        Tap the bookmark on any video to save it here
      </p>
      <button
        onClick={onBrowse}
        className="px-8 py-3 border border-[#c8a97e]/30 text-[#c8a97e]/70 text-xs tracking-[0.25em] uppercase hover:border-[#c8a97e]/60 hover:text-[#c8a97e] transition-colors duration-300"
      >
        Browse Videos
      </button>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-[#c8a97e]/40 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
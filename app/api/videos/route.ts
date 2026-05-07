import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NEW_CONTENT_COUNT, PREVIEW_VIDEO_COUNT } from "@/lib/constants";
import { FieldValue } from "firebase-admin/firestore";

// ─── Seeded random selection ──────────────────────────────────────────────────

function selectRandom<T>(arr: T[], n: number, seed: string): T[] {
  let s = [...seed].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

// ─── Shared video fetcher ─────────────────────────────────────────────────────

async function fetchVideosByIds(ids: string[]) {
  const docs = await Promise.all(
    ids.map((id) => adminDb.collection("videos").doc(id).get())
  );
  return docs
    .filter((d) => d.exists)
    .map((d) => {
      const v = d.data()!;
      return {
        id: d.id,
        bunnyVideoId: v.bunnyVideoId,
        playbackUrl: v.playbackUrl,
        thumbnailUrl: v.thumbnailUrl,
        tags: v.tags ?? [],
        createdAt: v.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // All feeds now require auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const feed = req.nextUrl.searchParams.get("feed");

  // ── Preview feed ────────────────────────────────────────────────────────────
  if (feed === "preview") {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const sessionRef = adminDb.collection("previewSessions").doc(decoded.uid);
    const sessionSnap = await sessionRef.get();

    // Return cached selection if still within 24h window
    if (sessionSnap.exists) {
      const data = sessionSnap.data()!;
      const generatedAt: number = data.generatedAt?.toMillis?.() ?? 0;
      if (now - generatedAt < TWENTY_FOUR_HOURS) {
        const videos = await fetchVideosByIds(data.videoIds ?? []);
        return NextResponse.json({
          videos,
          expiresAt: generatedAt + TWENTY_FOUR_HOURS,
        });
      }
    }

    // Generate fresh selection seeded by uid + calendar day
    const dayBucket = new Date().toISOString().slice(0, 10);
    const seed = `${decoded.uid}:${dayBucket}`;

    const snapshot = await adminDb.collection("videos").orderBy("createdAt", "desc").get();
    const allIds = snapshot.docs.map((d) => d.id);
    const selectedIds = selectRandom(allIds, PREVIEW_VIDEO_COUNT, seed);

    await sessionRef.set({
      videoIds: selectedIds,
      generatedAt: FieldValue.serverTimestamp(),
    });

    const videos = await fetchVideosByIds(selectedIds);
    return NextResponse.json({
      videos,
      expiresAt: now + TWENTY_FOUR_HOURS,
    });
  }

  // ── New feed: exclusive tier only ───────────────────────────────────────────
  if (feed === "new") {
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const tier = userDoc.data()?.subscriptionTier;
    if (tier !== "exclusive") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── General + new feeds ─────────────────────────────────────────────────────
  try {
    const snapshot = await adminDb
      .collection("videos")
      .orderBy("createdAt", "desc")
      .get();

    const allVideos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        bunnyVideoId: data.bunnyVideoId,
        playbackUrl: data.playbackUrl,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags ?? [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    const videos =
      feed === "new"
        ? allVideos.slice(0, NEW_CONTENT_COUNT)
        : allVideos.slice(NEW_CONTENT_COUNT);

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("Failed to fetch videos:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
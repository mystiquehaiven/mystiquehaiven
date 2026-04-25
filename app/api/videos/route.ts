import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NEW_CONTENT_COUNT } from "@/lib/constants";

export async function GET(req: NextRequest) {
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

if (feed === "new") {
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  const tier = userDoc.data()?.subscriptionTier;
  if (tier !== "exclusive") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

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
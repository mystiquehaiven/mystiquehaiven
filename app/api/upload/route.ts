import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createBunnyVideo, uploadToBunny, getBunnyPlaybackUrl, getBunnyThumbnailUrl } from "@/lib/bunny";

export async function POST(req: NextRequest) {
  // 1. Verify auth token from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 2. Check admin claim
  if (!decodedToken.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = `video_${Date.now()}`;
  const tagsRaw = formData.get("tags") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
  }

  if (file.size > 4 * 1024 * 1024) {
  return NextResponse.json(
    { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 4MB.` },
    { status: 413 }
  );
}

  const tags: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

  try {
    // 4. Create video record in Bunny
    const { videoId } = await createBunnyVideo(title);

    const arrayBuffer = await file.arrayBuffer();
    await uploadToBunny(videoId, arrayBuffer, file.type);

    // 6. Save metadata to Firestore
    await adminDb.collection("videos").doc(videoId).set({
      bunnyVideoId: videoId,
      title,
      tags,
      playbackUrl: getBunnyPlaybackUrl(videoId),
      thumbnailUrl: getBunnyThumbnailUrl(videoId),
      uploadedBy: decodedToken.uid,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, videoId });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("videos").get();
    const counts: Record<string, number> = {};

    snapshot.docs.forEach((doc) => {
      const tags: string[] = doc.data().tags ?? [];
      tags.forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      });
    });

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("Tag counts error:", err);
    return NextResponse.json({ error: "Failed to fetch tag counts" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const snapshot = await adminDb.collection("videos").get();

  const counts: Record<string, number> = {};

  for (const doc of snapshot.docs) {
    const tags: string[] = doc.data().tags ?? [];
    for (const tag of tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }

  return NextResponse.json({ counts });
}
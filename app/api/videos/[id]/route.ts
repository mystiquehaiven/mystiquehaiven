import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
    return decoded.admin === true ? decoded : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decoded = await requireAdmin(req);
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tags } = await req.json();
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
  }

  await adminDb.collection("videos").doc(id).update({ tags });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decoded = await requireAdmin(req);
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await adminDb.collection("videos").doc(id).delete();
  return NextResponse.json({ success: true });
}
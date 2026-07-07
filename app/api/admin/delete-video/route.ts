import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin"; // adjust path to wherever this file lives

export async function POST(req: NextRequest) {
	const authHeader = req.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
	if (!token) {
		return NextResponse.json({ error: "Missing token" }, { status: 401 });
	}

	let decoded;
	try {
		decoded = await adminAuth.verifyIdToken(token);
	} catch {
		return NextResponse.json({ error: "Invalid token" }, { status: 401 });
	}

	if (!decoded.admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { videoId } = await req.json();
	if (!videoId) {
		return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
	}

	const docRef = adminDb.collection("videos").doc(videoId);
	const snap = await docRef.get();

	if (!snap.exists) {
		return NextResponse.json({ error: "Video not found" }, { status: 404 });
	}

	const bunnyVideoId = snap.data()?.bunnyVideoId;
	const libraryId = process.env.BUNNY_LIBRARY_ID;
	const apiKey = process.env.BUNNY_STREAM_API_KEY;

	if (bunnyVideoId) {
		const bunnyRes = await fetch(
			`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideoId}`,
			{ method: "DELETE", headers: { AccessKey: apiKey! } }
		);

		if (!bunnyRes.ok && bunnyRes.status !== 404) {
			const text = await bunnyRes.text();
			return NextResponse.json(
				{ error: `Bunny.net deletion failed: ${text}` },
				{ status: 502 }
			);
		}
	}

	await docRef.delete();

	return NextResponse.json({ success: true });
}
// app/video-sitemap.xml/route.ts
//
// Serves a video sitemap at https://mystiquehaiven.com/video-sitemap.xml
// This is separate from your main page sitemap — submit it separately in
// Google Search Console (Sitemaps > Add a new sitemap > "video-sitemap.xml").
//
// Uses <video:player_loc> (Bunny embed URL) rather than <video:content_loc>,
// since the direct playback URL is token-gated and not publicly fetchable.
//
// NOTE: a single sitemap file is capped at 50,000 URLs / 50MB uncompressed.
// If your videos collection grows past ~40-45k docs, split this into an
// index sitemap + multiple video-sitemap-N.xml files. Not needed yet.

import { adminDb } from "@/lib/firebase-admin";

export const revalidate = 3600; // regenerate at most once per hour

const SITE_URL = "https://mystiquehaiven.com";
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIso8601Duration(seconds?: number | null): number | undefined {
  // video:duration wants a plain integer number of seconds, not ISO 8601
  if (!seconds || seconds <= 0) return undefined;
  return Math.round(seconds);
}

interface VideoDoc {
  id: string;
  thumbnailUrl: string;
  bunnyVideoId: string | null;
  durationSeconds: number | null;
  tags: string[];
  createdAt: string | null;
}

async function getAllVideos(): Promise<VideoDoc[]> {
  const snapshot = await adminDb.collection("videos").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      thumbnailUrl: data.thumbnailUrl as string,
      bunnyVideoId: (data.bunnyVideoId as string) ?? null,
      durationSeconds: (data.durationSeconds as number) ?? null,
      tags: (data.tags ?? []) as string[],
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  });
}

function buildVideoEntry(video: VideoDoc): string {
  const title = video.tags.length > 0 ? video.tags.join(", ") : "AI Video";
  const description = `AI-generated ${title} content on Mystique Haiven.`;
  const pageUrl = `${SITE_URL}/videos/${video.id}`;
  const durationSeconds = toIso8601Duration(video.durationSeconds);

  const playerLoc =
    video.bunnyVideoId && BUNNY_LIBRARY_ID
      ? `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${video.bunnyVideoId}`
      : null;

  // Skip videos we can't build a valid player_loc for — a video sitemap
  // entry without content_loc or player_loc is invalid per the spec.
  if (!playerLoc) return "";

  return `
  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(description)}</video:description>
      <video:player_loc>${escapeXml(playerLoc)}</video:player_loc>
      ${durationSeconds ? `<video:duration>${durationSeconds}</video:duration>` : ""}
      ${video.createdAt ? `<video:publication_date>${video.createdAt}</video:publication_date>` : ""}
      <video:family_friendly>no</video:family_friendly>
    </video:video>
  </url>`;
}

export async function GET() {
  const videos = await getAllVideos();

  const entries = videos
    .map(buildVideoEntry)
    .filter((entry) => entry.length > 0)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
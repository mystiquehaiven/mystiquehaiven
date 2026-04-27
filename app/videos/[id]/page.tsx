import { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

async function getVideo(id: string) {
  const doc = await adminDb.collection("videos").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    thumbnailUrl: data.thumbnailUrl as string,
    tags: (data.tags ?? []) as string[],
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return {};

  const title = video.tags.length > 0
    ? `${video.tags.join(", ")} — Mystique Haiven`
    : "Mystique Haiven";

  const description = video.tags.length > 0
    ? `Watch Erotic AI-generated ${video.tags.join(", ")} content on Mystique Haiven.`
    : "Watch Erotic AI-generated content on Mystique Haiven.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: video.thumbnailUrl, width: 1280, height: 720 }],
      type: "video.other",
      url: `https://mystiquehaiven.com/videos/${video.id}`,
      siteName: "Mystique Haiven",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [video.thumbnailUrl],
    },
  };
}

export default async function VideoPreviewPage({ params }: Props) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const title = video.tags.length > 0
    ? video.tags.join(", ")
    : "AI Video";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: `AI-generated ${title} content on Mystique Haiven.`,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.createdAt,
    url: `https://mystiquehaiven.com/videos/${video.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
        <div className="w-full max-w-lg flex flex-col items-center gap-6">
          <img
            src={video.thumbnailUrl}
            alt={title}
            className="w-full rounded-lg object-cover aspect-video"
          />
          <h1 className="text-xl font-semibold text-center">{title}</h1>
          <p className="text-sm text-neutral-400 text-center">
            This content is available exclusively to Mystique Haiven subscribers.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signin"
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/"
              className="px-5 py-2 rounded-full border border-white/20 text-sm hover:bg-white/10 transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
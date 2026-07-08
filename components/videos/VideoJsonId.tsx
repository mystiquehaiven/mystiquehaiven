import Script from 'next/script';

export interface VideoSchemaInput {
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string; // ISO 8601 string
  durationSeconds?: number;
  contentUrl?: string; // direct playable file URL, if you expose one
  embedUrl?: string; // Bunny iframe embed URL — most reliable field for Bunny Stream
  pageUrl: string; // canonical URL of this preview page
  isFamilyFriendly?: boolean; // defaults to false — override only if you add SFW-labeled content
}

function toIso8601Duration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}${s}S`;
}

export function buildVideoSchema(video: VideoSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.uploadDate,
    duration: toIso8601Duration(video.durationSeconds),
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    isFamilyFriendly: video.isFamilyFriendly ?? false,
    url: video.pageUrl,
  };

  // Strip undefined keys so the emitted JSON stays clean
  Object.keys(schema).forEach((key) => {
    if (schema[key] === undefined) delete schema[key];
  });

  return schema;
}

export default function VideoJsonLd({ video }: { video: VideoSchemaInput }) {
  const schema = buildVideoSchema(video);

  return (
    <Script
      id={`video-jsonld-${video.pageUrl}`}
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
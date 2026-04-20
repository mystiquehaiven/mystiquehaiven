const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!;
export const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME!;

export async function createBunnyVideo(title: string): Promise<{ videoId: string }> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to create Bunny video: ${res.statusText}`);
  }

  const data = await res.json();
  return { videoId: data.guid };
}

export async function uploadToBunny(
  videoId: string,
  stream: ReadableStream<Uint8Array>,
  contentType: string
): Promise<void> {
  console.log("Starting upload to Bunny for videoId:", videoId);
  console.log("Stream type:", stream.constructor.name);
  
  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": contentType,
      },
      body: stream as any,
    }
  );

  console.log("Bunny response status:", res.status);
  if (!res.ok) {
    throw new Error(`Failed to upload to Bunny: ${res.statusText}`);
  }
}

export function getBunnyPlaybackUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/play`;
}

export function getBunnyThumbnailUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}
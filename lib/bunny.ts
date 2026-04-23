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
  data: ArrayBuffer,
  contentType: string
): Promise<void> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": contentType,
      },
      body: new Uint8Array(data),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to upload to Bunny: ${res.statusText}`);
  }
}

export function getBunnyPlaybackUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
}

export function getBunnyThumbnailUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}
import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await adminDb.collection("videos").get();

  const videoEntries: MetadataRoute.Sitemap = snapshot.docs.map((doc) => ({
    url: `https://mystiquehaiven.com/videos/${doc.id}`,
    lastModified: doc.data().createdAt?.toDate?.() ?? new Date(),
    changeFrequency: "never",
    priority: 0.7,
  }));

  return [
    {
      url: "https://mystiquehaiven.com",
      changeFrequency: "monthly",
      priority: 1.0,
    },
    ...videoEntries,
  ];
}
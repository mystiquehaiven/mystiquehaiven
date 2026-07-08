import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
      },
    ],
    sitemap: [
      "https://mystiquehaiven.com/sitemap.xml",
      "https://mystiquehaiven.com/video-sitemap.xml",
    ],
  };
}
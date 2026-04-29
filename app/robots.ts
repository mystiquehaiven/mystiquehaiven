import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/videos$", "/videos/new", "/signin", "/api/"],
      },
    ],
    sitemap: "https://mystiquehaiven.com/sitemap.xml",
  };
}
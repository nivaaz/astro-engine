import type { MetadataRoute } from "next";

const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/events", "/saturn-return"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.8,
  }));
}

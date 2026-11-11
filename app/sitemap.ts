import type { MetadataRoute } from "next";
import { QUESTIONS } from "@/lib/questions";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/questions`, changeFrequency: "weekly", priority: 0.8 },
    ...QUESTIONS.map((q) => ({
      url: `${SITE_URL}/questions/${q.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

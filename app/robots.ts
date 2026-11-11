import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// AI assistants only recommend sites their crawlers can read. Name the main
// ones explicitly so a future blanket rule can't shut them out by accident.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search results
  "ChatGPT-User", // ChatGPT fetching a page a user asked about
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended", // Gemini
  "Applebot-Extended",
  "Bingbot", // also feeds Copilot and ChatGPT search
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/api/" })),
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

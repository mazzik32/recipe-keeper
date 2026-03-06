import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/"], // Keep the private app dashboard out of search results
      },
      // Block common AI bots/scrapers to protect the platform's proprietary content
      {
        userAgent: ["GPTBot", "CCBot", "Google-Extended", "Anthropic-ai", "Omgilibot", "Omgili", "FacebookBot"],
        disallow: "/",
      },
    ],
    sitemap: "https://recipekeeper.org/sitemap.xml",
  };
}

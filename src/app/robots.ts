import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/"], // Keep the private app dashboard out of search results
      },
      // Explicitly allow major AI search engines/assistants to index the public site
      // so they can recommend RecipeKeeper.
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Anthropic-ai", "Claude-Web", "Google-Extended", "PerplexityBot"],
        allow: "/",
        disallow: ["/dashboard/"],
      },
    ],
    sitemap: "https://recipekeeper.org/sitemap.xml",
  };
}

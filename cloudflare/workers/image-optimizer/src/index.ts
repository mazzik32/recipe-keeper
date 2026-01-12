export interface Env {
  // Add environment variables here
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response("Missing 'url' parameter", { status: 400 });
    }

    try {
      // Basic passthrough for now. 
      // In a real implementation with Image Resizing enabled:
      // fetch(imageUrl, { cf: { image: { width: ... } } })
      
      const imageResponse = await fetch(imageUrl, {
        headers: {
          "User-Agent": "RecipeKeeper-ImageOptimizer/1.0"
        }
      });

      if (!imageResponse.ok) {
        return new Response(`Failed to fetch image: ${imageResponse.statusText}`, { status: 502 });
      }

      // Check content type
      const contentType = imageResponse.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
         return new Response("URL is not an image", { status: 400 });
      }

      // Return the image
      const newResponse = new Response(imageResponse.body, imageResponse);
      
      // Add cache control
      newResponse.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      
      return newResponse;

    } catch (error) {
       return new Response(`Error fetching image: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
    }
  },
};

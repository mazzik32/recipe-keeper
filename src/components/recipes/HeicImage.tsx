"use client";

import React, { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";

/**
 * A wrapper for Next.js Image that can handle `.heic` and `.heif` images securely
 * by converting them to object URLs in the browser using `heic2any`.
 */
export function HeicImage({ src, alt, className, fill, ...props }: ImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let urlToRevoke: string | null = null;

    async function processHeic() {
      if (typeof src !== "string") return;

      const isHeic = src.toLowerCase().endsWith(".heic") || src.toLowerCase().endsWith(".heif");
      if (!isHeic) return;

      try {
        // Dynamically import to keep bundle small if the image isn't HEIC
        const heic2any = (await import("heic2any")).default;

        const res = await fetch(src);
        const blob = await res.blob();

        const conversionResult = await heic2any({ blob, toType: "image/jpeg" });
        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;

        if (active) {
          const newUrl = URL.createObjectURL(convertedBlob);
          setObjectUrl(newUrl);
          urlToRevoke = newUrl;
        }
      } catch (err) {
        console.error("HEIC conversion failed for", src, err);
        if (active) setError(true);
      }
    }

    processHeic();

    return () => {
      active = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [src]);

  const finalSrc = objectUrl || src;

  // Render normal image if it's not HEIC, or while converting
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized
      {...props}
    />
  );
}

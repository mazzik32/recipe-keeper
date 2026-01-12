"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket: "recipe-images" | "step-images" | "original-scans";
  folder?: string;
  className?: string;
  aspectRatio?: "video" | "square";
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  folder = "",
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, or WebP image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("You must be logged in");
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);

        onChange(publicUrl);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, folder, onChange, toast]
  );

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed border-warm-gray-200 rounded-xl overflow-hidden",
        aspectRatio === "video" ? "aspect-video" : "aspect-square",
        className
      )}
    >
      {value ? (
        <>
          <Image src={value} alt="Uploaded image" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-warm-gray-50 transition-colors">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-warm-gray-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-warm-gray-400 mb-2" />
              <span className="text-sm text-warm-gray-500">
                Click to upload image
              </span>
              <span className="text-xs text-warm-gray-400 mt-1">
                JPG, PNG, WebP (max 5MB)
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

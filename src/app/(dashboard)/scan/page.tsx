"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, FileText, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type ScanStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface ExtractedRecipe {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  suggestedCategory?: string;
}

export default function ScanRecipePage() {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, HEIC, WebP, or PDF file.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setStatus("uploading");
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setStatus("error");
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/scans/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("original-scans")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("original-scans")
        .getPublicUrl(fileName);

      setUploadedImageUrl(publicUrl);
      setStatus("analyzing");

      // Call the AI analysis edge function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-recipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ imageUrl: publicUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to analyze recipe");
      }

      const result = await response.json();
      setExtractedRecipe(result.data);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleProceed = async () => {
    if (!extractedRecipe) return;

    // Store extracted data in sessionStorage and redirect to new recipe form
    sessionStorage.setItem("scannedRecipe", JSON.stringify({
      ...extractedRecipe,
      originalImageUrl: uploadedImageUrl,
    }));
    router.push("/dashboard/recipes/new?from=scan");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Scan Recipe
        </h1>
        <p className="text-warm-gray-500">
          Upload a photo of a recipe and let AI extract the details automatically.
        </p>
      </div>

      {status === "idle" && (
        <Card
          className="border-2 border-dashed border-warm-gray-200 hover:border-peach-300 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-peach-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-peach-500" />
              </div>
              <h3 className="font-display text-xl text-warm-gray-700 mb-2">
                Upload Recipe Image
              </h3>
              <p className="text-warm-gray-400 mb-6">
                Drag and drop or click to upload a photo of your recipe
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700 cursor-pointer"
                    asChild
                  >
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Photo
                    </span>
                  </Button>
                </label>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-warm-gray-300 cursor-pointer"
                    asChild
                  >
                    <span>
                      <FileText className="w-4 h-4 mr-2" />
                      Upload PDF
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-warm-gray-400 mt-4">
                Supports JPG, PNG, HEIC, WebP, and PDF (max 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(status === "uploading" || status === "analyzing") && (
        <Card className="border-warm-gray-100">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-peach-100 flex items-center justify-center animate-pulse">
              {status === "uploading" ? (
                <Upload className="w-8 h-8 text-peach-500" />
              ) : (
                <Sparkles className="w-8 h-8 text-peach-500" />
              )}
            </div>
            <h3 className="font-display text-xl text-warm-gray-700 mb-2">
              {status === "uploading" ? "Uploading..." : "Analyzing Recipe..."}
            </h3>
            <p className="text-warm-gray-400">
              {status === "uploading"
                ? "Uploading your image..."
                : "AI is extracting recipe details. This may take a moment."}
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-peach-500" />
          </CardContent>
        </Card>
      )}

      {status === "complete" && extractedRecipe && (
        <div className="space-y-6">
          <Card className="border-warm-gray-100 bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-green-700">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Recipe extracted successfully!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warm-gray-100">
            <CardContent className="p-6">
              <h3 className="font-display text-2xl text-warm-gray-700 mb-4">
                {extractedRecipe.title}
              </h3>
              {extractedRecipe.description && (
                <p className="text-warm-gray-500 mb-4">{extractedRecipe.description}</p>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-warm-gray-700 mb-2">
                    Ingredients ({extractedRecipe.ingredients.length})
                  </h4>
                  <ul className="text-sm text-warm-gray-500 space-y-1">
                    {extractedRecipe.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i}>
                        • {ing.quantity} {ing.unit} {ing.name}
                      </li>
                    ))}
                    {extractedRecipe.ingredients.length > 5 && (
                      <li className="text-warm-gray-400">
                        ... and {extractedRecipe.ingredients.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-warm-gray-700 mb-2">
                    Steps ({extractedRecipe.steps.length})
                  </h4>
                  <ul className="text-sm text-warm-gray-500 space-y-1">
                    {extractedRecipe.steps.slice(0, 3).map((step, i) => (
                      <li key={i} className="line-clamp-1">
                        {step.stepNumber}. {step.instruction}
                      </li>
                    ))}
                    {extractedRecipe.steps.length > 3 && (
                      <li className="text-warm-gray-400">
                        ... and {extractedRecipe.steps.length - 3} more steps
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setExtractedRecipe(null);
                setUploadedImageUrl(null);
              }}
              className="border-warm-gray-300"
            >
              Scan Another
            </Button>
            <Button
              onClick={handleProceed}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              Review & Save
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <Card className="border-warm-gray-100 bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Camera, FileText, Loader2, Sparkles, ArrowRight, X, Plus, Languages, Link as LinkIcon, CaseUpper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ScanStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
}

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
  detectedLanguage?: string;
  wasTranslated?: boolean;
}

interface AnalysisResult {
  data: ExtractedRecipe;
  imagesProcessed?: number;
  targetLanguage: string;
  detectedLanguage?: string;
  detectedLanguageName?: string;
  wasTranslated: boolean;
}

export default function ScanRecipePage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Input State
  const [inputMode, setInputMode] = useState<"image" | "web" | "text">("image");

  // Image Mode State
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // Web Mode State
  const [recipeUrl, setRecipeUrl] = useState("");

  // Text Mode State
  const [recipeText, setRecipeText] = useState("");

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validTypes = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];

    const newImages: UploadedImage[] = [];

    for (const file of fileArray) {
      if (!validTypes.includes(file.type)) {
        setError(t.scan.invalidFileType);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.scan.fileTooLarge);
        continue;
      }
      if (images.length + newImages.length >= 5) {
        setError(t.scan.maxImagesReached);
        break;
      }

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  }, [images.length, t.scan]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const getSession = async () => {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError(t.auth.sessionExpired);
      setStatus("error");
      return null;
    }
    return { session, supabase };
  };

  const handleAnalyzeImages = useCallback(async () => {
    if (images.length === 0) return;

    setStatus("uploading");
    setError(null);

    const sessionData = await getSession();
    if (!sessionData) return;
    const { session, supabase } = sessionData;

    const user = session.user;
    const uploadedUrls: string[] = [];

    try {
      // Upload all images to Supabase Storage
      for (const image of images) {
        const fileName = `${user.id}/scans/${Date.now()}-${image.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("original-scans")
          .upload(fileName, image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("original-scans")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setUploadedImageUrls(uploadedUrls);
      setStatus("analyzing");

      // Call the AI analysis edge function with multiple images and target language
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-recipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageUrls: uploadedUrls,
            targetLanguage: locale,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to analyze recipe");
      }

      const result: { success: boolean } & AnalysisResult = await response.json();
      setExtractedRecipe(result.data);
      setAnalysisResult(result);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process images");
      setStatus("error");
    }
  }, [images, locale, t.auth.sessionExpired]);

  const handleScrapeUrl = useCallback(async () => {
    if (!recipeUrl) return;

    setStatus("analyzing");
    setError(null);

    const sessionData = await getSession();
    if (!sessionData) return;
    const { session } = sessionData;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scrape-recipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            url: recipeUrl,
            targetLanguage: locale,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to scrape recipe");
      }

      const result: { success: boolean } & AnalysisResult = await response.json();
      setExtractedRecipe(result.data);
      setAnalysisResult(result);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape URL");
      setStatus("error");
    }
  }, [recipeUrl, locale, t.auth.sessionExpired]);

  const handleParseText = useCallback(async () => {
    if (!recipeText) return;

    setStatus("analyzing");
    setError(null);

    const sessionData = await getSession();
    if (!sessionData) return;
    const { session } = sessionData;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parse-recipe-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: recipeText,
            targetLanguage: locale,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to parse text");
      }

      const result: { success: boolean } & AnalysisResult = await response.json();
      setExtractedRecipe(result.data);
      setAnalysisResult(result);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse text");
      setStatus("error");
    }
  }, [recipeText, locale, t.auth.sessionExpired]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleProceed = async () => {
    if (!extractedRecipe) return;

    sessionStorage.setItem("scannedRecipe", JSON.stringify({
      ...extractedRecipe,
      originalImageUrl: uploadedImageUrls[0],
      originalImageUrls: uploadedImageUrls,
    }));
    router.push("/dashboard/recipes/new?from=scan");
  };

  const resetScan = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setUploadedImageUrls([]);
    setExtractedRecipe(null);
    setAnalysisResult(null);
    setStatus("idle");
    setError(null);
    setRecipeUrl("");
    setRecipeText("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.scan.title}
        </h1>
        <p className="text-warm-gray-500">
          {t.scan.description}
        </p>
      </div>

      {status === "idle" && (
        <Tabs value={inputMode} onValueChange={(val) => setInputMode(val as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image" className="gap-2">
              <Camera className="w-4 h-4" />
              {t.scan.imageMode || "Image"}
            </TabsTrigger>
            <TabsTrigger value="web" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              {t.scan.webMode || "Web URL"}
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <CaseUpper className="w-4 h-4" />
              {t.scan.textMode || "Paste Text"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-6">
            {/* Drop Zone */}
            <Card
              className="border-2 border-dashed border-warm-gray-200 hover:border-peach-300 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-peach-100 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-peach-500" />
                  </div>
                  <h3 className="font-display text-lg text-warm-gray-700 mb-2">
                    {images.length === 0 ? t.scan.uploadImages : t.scan.addMoreImages}
                  </h3>
                  <p className="text-warm-gray-400 text-sm mb-4">
                    {t.scan.dragDrop} ({t.scan.maxImages})
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) addFiles(e.target.files);
                        }}
                      />
                      <Button
                        type="button"
                        className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700 cursor-pointer"
                        asChild
                      >
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          {t.scan.choosePhotos}
                        </span>
                      </Button>
                    </label>
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files) addFiles(e.target.files);
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
                          {t.scan.uploadPdf}
                        </span>
                      </Button>
                    </label>
                  </div>
                  <p className="text-xs text-warm-gray-400 mt-4">
                    {t.scan.supportedFormats}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-warm-gray-700">
                    {t.scan.selectedImages} ({images.length}/5)
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetScan}
                    className="text-warm-gray-500"
                  >
                    {t.scan.clearAll}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-warm-gray-200 group"
                    >
                      <Image
                        src={image.preview}
                        alt={`${t.scan.page} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-warm-gray-600" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-warm-gray-700">
                        {t.scan.page} {index + 1}
                      </div>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-warm-gray-200 hover:border-peach-300 flex items-center justify-center cursor-pointer transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) addFiles(e.target.files);
                        }}
                      />
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-warm-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-warm-gray-400">{t.scan.addMore}</span>
                      </div>
                    </label>
                  )}
                </div>

                <Button
                  onClick={handleAnalyzeImages}
                  className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.scan.analyze} {images.length} {images.length === 1 ? "Image" : "Images"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="web" className="space-y-6">
            <Card className="border-warm-gray-100">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-warm-gray-700 mb-2">Import from URL</h3>
                    <p className="text-warm-gray-400 text-sm mb-4">
                      Paste the URL of a recipe page you want to import.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/recipe/..."
                      value={recipeUrl}
                      onChange={(e) => setRecipeUrl(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    onClick={handleScrapeUrl}
                    disabled={!recipeUrl}
                    className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Import Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <Card className="border-warm-gray-100">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-warm-gray-700 mb-2">Paste Recipe Text</h3>
                    <p className="text-warm-gray-400 text-sm mb-4">
                      Paste any recipe text here (e.g. from an email, PDF, or document).
                    </p>
                  </div>
                  <Textarea
                    placeholder="Recipe Title
                    
Ingredients:
...

Instructions:
..."
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button
                    onClick={handleParseText}
                    disabled={!recipeText}
                    className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Text
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </Tabs>
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
              {status === "uploading" ? (t.scan.uploading || "Uploading...") : (t.scan.analyzing || "Analyzing...")}
            </h3>
            <p className="text-warm-gray-400">
              {status === "uploading"
                ? `${images.length} ${images.length === 1 ? "image" : "images"} uploading...`
                : (t.scan.analyzingDesc || "Processing content...")}
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
                <span className="font-medium">
                  {t.scan.extractionSuccess.replace("{count}", String(Math.max(1, uploadedImageUrls ? uploadedImageUrls.length : 1)))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Translation indicator */}
          {analysisResult?.wasTranslated && analysisResult.detectedLanguageName && (
            <Card className="border-warm-gray-100 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-blue-700">
                  <Languages className="w-5 h-5" />
                  <span className="text-sm">
                    {t.scan.translatedFrom.replace("{language}", analysisResult.detectedLanguageName)}
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 ml-auto">
                    {analysisResult.detectedLanguage?.toUpperCase()} → {locale.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview of uploaded images */}
          {uploadedImageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uploadedImageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-warm-gray-200">
                  <Image src={url} alt={`${t.scan.page} ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

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
                    {t.recipes.ingredients} ({extractedRecipe.ingredients.length})
                  </h4>
                  <ul className="text-sm text-warm-gray-500 space-y-1">
                    {extractedRecipe.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i}>
                        • {ing.quantity} {ing.unit} {ing.name}
                      </li>
                    ))}
                    {extractedRecipe.ingredients.length > 5 && (
                      <li className="text-warm-gray-400">
                        ... {locale === "de" ? "und" : "and"} {extractedRecipe.ingredients.length - 5} {locale === "de" ? "weitere" : "more"}
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-warm-gray-700 mb-2">
                    {t.recipes.instructions} ({extractedRecipe.steps.length})
                  </h4>
                  <ul className="text-sm text-warm-gray-500 space-y-1">
                    {extractedRecipe.steps.slice(0, 3).map((step, i) => (
                      <li key={i} className="line-clamp-1">
                        {step.stepNumber}. {step.instruction}
                      </li>
                    ))}
                    {extractedRecipe.steps.length > 3 && (
                      <li className="text-warm-gray-400">
                        ... {locale === "de" ? "und" : "and"} {extractedRecipe.steps.length - 3} {locale === "de" ? "weitere Schritte" : "more steps"}
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
              onClick={resetScan}
              className="border-warm-gray-300"
            >
              {t.scan.scanAnother}
            </Button>
            <Button
              onClick={handleProceed}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              {t.scan.reviewSave}
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
              onClick={resetScan}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              {t.common.tryAgain}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

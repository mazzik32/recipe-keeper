"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategoryName } from "@/lib/i18n";
import type { RecipeWithRelations } from "@/types/database.types";

export default function RecipeBookPage() {
  const { locale, t } = useLanguage();
  const [recipes, setRecipes] = useState<RecipeWithRelations[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookTitle, setBookTitle] = useState(
    locale === "de" ? "Familienrezepte" : "Family Recipes"
  );
  const [dedication, setDedication] = useState("");

  useEffect(() => {
    async function loadRecipes() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("recipes")
          .select(`*, category:categories(*), images:recipe_images(*)`)
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("title");

        setRecipes(data || []);
      }
      setIsLoading(false);
    }

    loadRecipes();
  }, []);

  const toggleRecipe = (id: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecipes(newSelected);
  };

  const selectAll = () => {
    if (selectedRecipes.size === recipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(recipes.map((r) => r.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedRecipes.size === 0) return;

    setIsGenerating(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t.auth.sessionExpired);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(t.auth.sessionExpired);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipeIds: Array.from(selectedRecipes),
            options: {
              title: bookTitle,
              dedication: dedication,
              locale: locale,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || t.errors.generic);
      }

      const result = await response.json();

      if (result.data?.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        } else {
          alert(locale === "de" 
            ? "Bitte erlauben Sie Popups, um das Rezeptbuch zu erstellen." 
            : "Please allow popups to generate the recipe book.");
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-peach-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.recipeBook.title}
        </h1>
        <p className="text-warm-gray-500">
          {t.recipeBook.description}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-warm-gray-100">
            <CardHeader>
              <CardTitle className="font-display text-lg text-warm-gray-700">
                {locale === "de" ? "Bucheinstellungen" : "Book Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t.recipeBook.bookTitle}</Label>
                <Input
                  id="title"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder={t.recipeBook.bookTitlePlaceholder}
                  className="border-warm-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dedication">{t.recipeBook.dedication} ({t.common.optional})</Label>
                <Textarea
                  id="dedication"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder={t.recipeBook.dedicationPlaceholder}
                  className="border-warm-gray-200 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedRecipes.size === 0}
            className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.recipeBook.generating}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t.recipeBook.generatePdf} ({selectedRecipes.size} {t.recipes.recipes.toLowerCase()})
              </>
            )}
          </Button>
        </div>

        {/* Recipe Selection */}
        <div className="md:col-span-2">
          <Card className="border-warm-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg text-warm-gray-700">
                {t.recipeBook.selectRecipes}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-peach-600"
              >
                {selectedRecipes.size === recipes.length
                  ? t.recipeBook.deselectAll
                  : t.recipeBook.selectAll}
              </Button>
            </CardHeader>
            <CardContent>
              {recipes.length === 0 ? (
                <div className="text-center py-8 text-warm-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-warm-gray-300" />
                  <p>{t.recipes.noRecipes}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recipes.map((recipe) => (
                    <label
                      key={recipe.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedRecipes.has(recipe.id)
                        ? "bg-peach-50 border border-peach-200"
                        : "hover:bg-warm-gray-50 border border-transparent"
                        }`}
                    >
                      <Checkbox
                        checked={selectedRecipes.has(recipe.id)}
                        onCheckedChange={() => toggleRecipe(recipe.id)}
                        className="border-warm-gray-300 data-[state=checked]:bg-peach-400 data-[state=checked]:border-peach-400"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-gray-700 truncate">
                          {recipe.title}
                        </p>
                        {recipe.category && (
                          <p className="text-sm text-warm-gray-400">
                            {recipe.category.icon} {translateCategoryName(recipe.category.name, t)}
                          </p>
                        )}
                      </div>
                      {selectedRecipes.has(recipe.id) && (
                        <Check className="w-5 h-5 text-peach-500" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

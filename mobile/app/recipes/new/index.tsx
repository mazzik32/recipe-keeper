import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ReviewScannedRecipeScreen() {
    const { recipe } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();

    // Parse the structured data returned from OpenAI
    const initialData = recipe ? JSON.parse(recipe as string) : null;

    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [ingredients, setIngredients] = useState<any[]>(initialData?.ingredients || []);
    const [instructions, setInstructions] = useState<any[]>(initialData?.steps || []);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title) {
            Alert.alert("Error", "Recipe must have a title.");
            return;
        }

        setSaving(true);
        try {
            // 1. Insert the main recipe record
            const { data: newRecipe, error: recipeError } = await supabase
                .from("recipes")
                .insert({
                    user_id: user?.id,
                    title,
                    description,
                    prep_time_minutes: initialData?.prepTimeMinutes || null,
                    cook_time_minutes: initialData?.cookTimeMinutes || null,
                    servings: initialData?.servings || null,
                    difficulty: initialData?.difficulty || null,
                    is_favorite: false,
                    is_archived: false,
                })
                .select()
                .single();

            if (recipeError) throw recipeError;

            // 2. Insert ingredients (JSONB array structure matches web)
            if (ingredients.length > 0) {
                // Process mapping to db structure if needed
                const mappedIngredients = ingredients.map((ing, idx) => ({
                    recipe_id: newRecipe.id,
                    name: ing.name,
                    quantity: ing.quantity || null,
                    unit: ing.unit || "",
                    notes: ing.notes || "",
                    order_index: idx
                }));

                const { error: ingError } = await supabase
                    .from("recipe_ingredients")
                    .insert(mappedIngredients);

                if (ingError) console.error("Error saving ingredients", ingError);
            }

            // 3. Insert instructions
            if (instructions.length > 0) {
                const mappedInstructions = instructions.map((inst, idx) => ({
                    recipe_id: newRecipe.id,
                    step_number: idx + 1,
                    instruction: inst.instruction
                }));

                const { error: instError } = await supabase
                    .from("recipe_steps")
                    .insert(mappedInstructions);

                if (instError) console.error("Error saving instructions", instError);
            }

            // 4. Link the uploaded image
            if (initialData?.originalImageUrl) {
                await supabase
                    .from("recipe_images")
                    .insert({
                        recipe_id: newRecipe.id,
                        image_url: initialData.originalImageUrl, // Note: For persistence, signedUrls expire. The web app uses standard publicUrls, but since we used original-scans bucket here, we just save the signed one for MVP, though it will break. We should switch to a persistent URL later.
                        is_primary: true
                    });
            }

            // Navigate to the newly created recipe details
            router.replace(`/(tabs)/`);
            router.push(`/recipes/${newRecipe.id}`);

        } catch (error: any) {
            Alert.alert("Error Saving", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!initialData) {
        return (
            <View className="flex-1 bg-cream items-center justify-center">
                <Text>{t.errors?.notFound || "No recipe data found to review."}</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 p-4">
                    <Text className="text-peach-600">{t.common.back}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-cream">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-warm-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <ArrowLeft color="#75716d" size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-700">{t.add.reviewSave}</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-peach-500 px-4 py-2 rounded-full">
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{t.common.save}</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-6" keyboardDismissMode="on-drag">

                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.recipeTitle || "Title"}</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        className="bg-white border border-warm-gray-200 rounded-xl px-4 py-4 font-display text-xl text-warm-gray-700"
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.description}</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        className="bg-white border border-warm-gray-200 rounded-xl px-4 py-4 text-warm-gray-600 min-h-[100px] text-base leading-relaxed"
                        textAlignVertical="top"
                    />
                </View>

                {/* Ingredients Preview */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700">Ingredients</Text>
                        <TouchableOpacity className="p-2 bg-peach-100 rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100">
                        {ingredients.map((ing, idx) => (
                            <View key={idx} className="flex-row items-center py-2 border-b border-warm-gray-50 last:border-0">
                                <TextInput
                                    value={`${ing.quantity || ''} ${ing.unit || ''}`.trim()}
                                    className="w-24 font-semibold text-peach-600 border-r border-warm-gray-100 mr-3"
                                />
                                <TextInput
                                    value={ing.name}
                                    className="flex-1 text-warm-gray-700"
                                />
                                <TouchableOpacity className="p-2">
                                    <Trash2 color="#dfd8d3" size={18} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Steps Preview */}
                <View className="mb-12">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700">Instructions</Text>
                        <TouchableOpacity className="p-2 bg-peach-100 rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="space-y-4">
                        {instructions.map((step, idx) => (
                            <View key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100 flex-row">
                                <View className="w-8 h-8 rounded-full bg-peach-100 items-center justify-center mr-3 mt-1">
                                    <Text className="text-peach-700 font-bold">{idx + 1}</Text>
                                </View>
                                <TextInput
                                    value={step.instruction}
                                    multiline
                                    className="flex-1 text-warm-gray-600 text-base leading-relaxed min-h-[60px]"
                                />
                            </View>
                        ))}
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}

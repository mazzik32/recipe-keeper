import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { RecipeTagsInput, Tag } from "../../components/RecipeTagsInput";

export default function RecipeFormScreen() {
    const { mode, id, recipe: recipeParam } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();

    const isEdit = mode === "edit";

    // Parse pre-filled data from scan flow if provided
    const scannedData = recipeParam ? JSON.parse(recipeParam as string) : null;

    const [title, setTitle] = useState(scannedData?.title || "");
    const [description, setDescription] = useState(scannedData?.description || "");
    const [ingredients, setIngredients] = useState<any[]>(scannedData?.ingredients || []);
    const [instructions, setInstructions] = useState<any[]>(scannedData?.steps || []);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(
        scannedData?.originalImageUrls || (scannedData?.originalImageUrl ? [scannedData.originalImageUrl] : [])
    );
    const [recipeMetadata, setRecipeMetadata] = useState<any>(null);
    const [tags, setTags] = useState<Tag[]>([]);

    // Load existing recipe data for edit mode
    useEffect(() => {
        if (!isEdit || !id) return;

        async function loadRecipe() {
            const { data, error } = await supabase
                .from("recipes")
                .select(`
                    *,
                    images:recipe_images(*),
                    ingredients:recipe_ingredients(*),
                    instructions:recipe_steps(*),
                    recipe_tags(tag:tags(*))
                `)
                .eq("id", id)
                .single();

            if (error || !data) {
                Alert.alert(t.common.error, t.errors.notFound);
                router.back();
                return;
            }

            // Sort by order
            if (data.ingredients) {
                data.ingredients.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            }
            if (data.instructions) {
                data.instructions.sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0));
            }

            setTitle(data.title || "");
            setDescription(data.description || "");
            setIngredients(data.ingredients || []);
            setInstructions(data.instructions || []);
            setRecipeMetadata(data);
            setOriginalImageUrls(data.images?.map((img: any) => img.image_url) || []);
            if (data.recipe_tags) {
                const loadedTags = data.recipe_tags
                    .map((rt: any) => rt.tag)
                    .filter((t: any): t is Tag => !!t && typeof t.id === 'string');
                setTags(loadedTags);
            }
            setLoading(false);
        }

        loadRecipe();
    }, [isEdit, id]);

    const addIngredient = () => {
        setIngredients(prev => [...prev, { name: "", quantity: "", unit: "" }]);
    };

    const updateIngredient = (index: number, field: string, value: string) => {
        setIngredients(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeIngredient = (index: number) => {
        setIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const addInstruction = () => {
        setInstructions(prev => [...prev, { instruction: "" }]);
    };

    const updateInstruction = (index: number, value: string) => {
        setInstructions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], instruction: value };
            return updated;
        });
    };

    const removeInstruction = (index: number) => {
        setInstructions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert(t.common.error, "Recipe must have a title.");
            return;
        }

        setSaving(true);
        try {
            if (isEdit && id) {
                // --- UPDATE EXISTING RECIPE ---
                const { error: updateError } = await supabase
                    .from("recipes")
                    .update({
                        title,
                        description,
                        prep_time_minutes: recipeMetadata?.prep_time_minutes || null,
                        cook_time_minutes: recipeMetadata?.cook_time_minutes || null,
                        servings: recipeMetadata?.servings || null,
                        difficulty: recipeMetadata?.difficulty || null,
                    })
                    .eq("id", id);

                if (updateError) throw updateError;

                // Delete old ingredients and re-insert
                await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
                if (ingredients.length > 0) {
                    const mappedIngredients = ingredients.map((ing, idx) => ({
                        recipe_id: id,
                        name: ing.name,
                        quantity: ing.quantity || null,
                        unit: ing.unit || "",
                        notes: ing.notes || "",
                        order_index: idx,
                    }));
                    const { error: ingError } = await supabase
                        .from("recipe_ingredients")
                        .insert(mappedIngredients);
                    if (ingError) console.error("Error saving ingredients", ingError);
                }

                // Delete old instructions and re-insert
                await supabase.from("recipe_steps").delete().eq("recipe_id", id);
                if (instructions.length > 0) {
                    const mappedInstructions = instructions.map((inst, idx) => ({
                        recipe_id: id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                    }));
                    const { error: instError } = await supabase
                        .from("recipe_steps")
                        .insert(mappedInstructions);
                    if (instError) console.error("Error saving instructions", instError);
                }

                // Delete old tags and re-insert
                await supabase.from("recipe_tags").delete().eq("recipe_id", id);
                if (tags.length > 0) {
                    const tagRows = tags.map(tag => ({
                        recipe_id: id,
                        tag_id: tag.id
                    }));
                    const { error: tagsError } = await supabase.from("recipe_tags").insert(tagRows);
                    if (tagsError) console.error("Error saving tags", tagsError);
                }

                // Clear AsyncStorage cache for this recipe
                try {
                    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
                    await AsyncStorage.removeItem(`recipe_detail_${id}`);
                } catch (e) { }

                router.back();
            } else {
                // --- CREATE NEW RECIPE ---
                const { data: newRecipe, error: recipeError } = await supabase
                    .from("recipes")
                    .insert({
                        user_id: user?.id,
                        title,
                        description,
                        prep_time_minutes: scannedData?.prepTimeMinutes || null,
                        cook_time_minutes: scannedData?.cookTimeMinutes || null,
                        servings: scannedData?.servings || null,
                        difficulty: scannedData?.difficulty || null,
                        is_favorite: false,
                        is_archived: false,
                    })
                    .select()
                    .single();

                if (recipeError) throw recipeError;

                // Insert ingredients
                if (ingredients.length > 0) {
                    const mappedIngredients = ingredients.map((ing, idx) => ({
                        recipe_id: newRecipe.id,
                        name: ing.name,
                        quantity: ing.quantity || null,
                        unit: ing.unit || "",
                        notes: ing.notes || "",
                        order_index: idx,
                    }));
                    const { error: ingError } = await supabase
                        .from("recipe_ingredients")
                        .insert(mappedIngredients);
                    if (ingError) console.error("Error saving ingredients", ingError);
                }

                // Insert instructions
                if (instructions.length > 0) {
                    const mappedInstructions = instructions.map((inst, idx) => ({
                        recipe_id: newRecipe.id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                    }));
                    const { error: instError } = await supabase
                        .from("recipe_steps")
                        .insert(mappedInstructions);
                    if (instError) console.error("Error saving instructions", instError);
                }

                // Link uploaded images if any
                if (originalImageUrls.length > 0) {
                    const imageRows = originalImageUrls.map((url: string, idx: number) => ({
                        recipe_id: newRecipe.id,
                        image_url: url,
                        is_primary: idx === 0,
                    }));
                    await supabase.from("recipe_images").insert(imageRows);
                }

                // Link tags
                if (tags.length > 0) {
                    const tagRows = tags.map(tag => ({
                        recipe_id: newRecipe.id,
                        tag_id: tag.id
                    }));
                    const { error: tagsError } = await supabase.from("recipe_tags").insert(tagRows);
                    if (tagsError) console.error("Error saving tags", tagsError);
                }

                router.replace(`/(tabs)/`);
                router.push(`/recipes/${newRecipe.id}`);
            }
        } catch (error: any) {
            Alert.alert(t.common.error, error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-cream justify-center items-center">
                <ActivityIndicator size="large" color="#eb6e3e" />
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
                <Text className="font-playfair text-xl text-warm-gray-700">
                    {isEdit ? t.recipes.editRecipe : t.add.addRecipeTitle}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-peach-500 px-4 py-2 rounded-full">
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEdit ? t.recipes.updateRecipe : t.common.save}</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-6" keyboardDismissMode="on-drag">

                {/* Title */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.recipeTitle || "Title"}</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder={t.add.recipeTitle}
                        className="bg-white border border-warm-gray-200 rounded-xl px-4 py-4 font-display text-xl text-warm-gray-700"
                    />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.description}</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder={t.recipes.description}
                        className="bg-white border border-warm-gray-200 rounded-xl px-4 py-4 text-warm-gray-600 min-h-[100px] text-base leading-relaxed"
                        textAlignVertical="top"
                    />
                </View>

                {/* Tags */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.tags?.tags || "Tags"}</Text>
                    <RecipeTagsInput value={tags} onChange={setTags} />
                </View>

                {/* Ingredients */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700">{t.recipes.ingredients}</Text>
                        <TouchableOpacity onPress={addIngredient} className="p-2 bg-peach-100 rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100">
                        {ingredients.length === 0 ? (
                            <TouchableOpacity onPress={addIngredient} className="py-4 items-center">
                                <Text className="text-warm-gray-400">{t.common.add} {t.recipes.ingredients.toLowerCase()}</Text>
                            </TouchableOpacity>
                        ) : (
                            ingredients.map((ing, idx) => (
                                <View key={idx} className="flex-row items-center py-2 border-b border-warm-gray-50">
                                    <TextInput
                                        value={`${ing.quantity || ''}`}
                                        onChangeText={(v) => updateIngredient(idx, "quantity", v)}
                                        placeholder={t.add.amount}
                                        className="w-14 text-peach-600 font-semibold"
                                        keyboardType="decimal-pad"
                                    />
                                    <TextInput
                                        value={ing.unit || ''}
                                        onChangeText={(v) => updateIngredient(idx, "unit", v)}
                                        placeholder={t.add.unit}
                                        className="w-14 text-warm-gray-500 border-r border-warm-gray-100 mr-3"
                                    />
                                    <TextInput
                                        value={ing.name}
                                        onChangeText={(v) => updateIngredient(idx, "name", v)}
                                        placeholder={t.add.ingredientName}
                                        className="flex-1 text-warm-gray-700"
                                    />
                                    <TouchableOpacity onPress={() => removeIngredient(idx)} className="p-2">
                                        <Trash2 color="#dfd8d3" size={18} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Instructions */}
                <View className="mb-12">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700">{t.recipes.instructions}</Text>
                        <TouchableOpacity onPress={addInstruction} className="p-2 bg-peach-100 rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="space-y-4">
                        {instructions.length === 0 ? (
                            <TouchableOpacity onPress={addInstruction} className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100 items-center">
                                <Text className="text-warm-gray-400">{t.common.add} {t.recipes.instructions.toLowerCase()}</Text>
                            </TouchableOpacity>
                        ) : (
                            instructions.map((step, idx) => (
                                <View key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100 flex-row">
                                    <View className="w-8 h-8 rounded-full bg-peach-100 items-center justify-center mr-3 mt-1">
                                        <Text className="text-peach-700 font-bold">{idx + 1}</Text>
                                    </View>
                                    <TextInput
                                        value={step.instruction}
                                        onChangeText={(v) => updateInstruction(idx, v)}
                                        multiline
                                        placeholder={t.add.instruction}
                                        className="flex-1 text-warm-gray-600 text-base leading-relaxed min-h-[60px]"
                                    />
                                    <TouchableOpacity onPress={() => removeInstruction(idx)} className="p-2">
                                        <Trash2 color="#dfd8d3" size={18} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}

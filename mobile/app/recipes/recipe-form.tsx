import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save, Trash2, Plus, Sparkles } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import WhiskLoader from "../../components/WhiskLoader";
import { RecipeTagsInput, Tag } from "../../components/RecipeTagsInput";
import { ImageUpload, uploadImageToSupabase } from "../../components/ImageUpload";
import { Picker } from '@react-native-picker/picker';
import { useTheme } from "../../contexts/ThemeContext";

export default function RecipeFormScreen() {
    const { mode, id, recipe: recipeParam, scanImageCount } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t, ti } = useLanguage();

    const isEdit = mode === "edit";
    const { colors } = useTheme();

    // Parse pre-filled data from scan flow if provided
    const scannedData = recipeParam ? JSON.parse(recipeParam as string) : null;

    const [title, setTitle] = useState(scannedData?.title || "");
    const [description, setDescription] = useState(scannedData?.description || "");
    const [ingredients, setIngredients] = useState<any[]>(scannedData?.ingredients || []);
    const [instructions, setInstructions] = useState<any[]>(scannedData?.steps || []);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [primaryImage, setPrimaryImage] = useState<string | null>(scannedData?.originalImageUrls?.[0] || scannedData?.originalImageUrl || null);
    const [secondaryImage, setSecondaryImage] = useState<string | null>(scannedData?.originalImageUrls?.[1] || null);
    const [categoryId, setCategoryId] = useState<string | null>(scannedData?.category_id || null);
    const [categories, setCategories] = useState<any[]>([]);
    const [collectionId, setCollectionId] = useState<string | null>(scannedData?.collection_id || null);
    const [collections, setCollections] = useState<any[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    // Metadata fields
    const [servings, setServings] = useState<string>(scannedData?.servings ? String(scannedData.servings) : "");
    const [prepTime, setPrepTime] = useState<string>(scannedData?.prepTimeMinutes ? String(scannedData.prepTimeMinutes) : "");
    const [cookTime, setCookTime] = useState<string>(scannedData?.cookTimeMinutes ? String(scannedData.cookTimeMinutes) : "");
    const [totalTime, setTotalTime] = useState<string>(scannedData?.totalTimeMinutes ? String(scannedData.totalTimeMinutes) : "");
    const [difficulty, setDifficulty] = useState<string>(scannedData?.difficulty || "medium");
    const [source, setSource] = useState<string>(scannedData?.source || "");

    // Load existing recipe data for edit mode
    useEffect(() => {
        async function fetchDropdowns() {
            const { data: cats } = await supabase.from("categories").select("*").order("name");
            if (cats) setCategories(cats);

            if (user) {
                const { data: cols } = await supabase.from("collections").select("*").eq("user_id", user.id).order("name");
                if (cols) setCollections(cols);
            }
        }
        fetchDropdowns();

        if (!isEdit || !id) return;

        async function loadRecipe() {
            const { data, error } = await supabase
                .from("recipes")
                .select(`
                    *,
                    images:recipe_images(*),
                    ingredients:recipe_ingredients(*),
                    instructions:recipe_steps(*),
                    recipe_tags(tag:tags(*)),
                    recipe_collections(collection_id)
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
            setPrimaryImage(data.images?.find((img: any) => img.is_primary)?.image_url || null);
            setSecondaryImage(data.images?.find((img: any) => !img.is_primary)?.image_url || null);
            setCategoryId(data.category_id || null);
            setCollectionId(data.recipe_collections?.[0]?.collection_id || null);
            setServings(data.servings ? String(data.servings) : "");
            setPrepTime(data.prep_time_minutes ? String(data.prep_time_minutes) : "");
            setCookTime(data.cook_time_minutes ? String(data.cook_time_minutes) : "");
            setTotalTime(data.total_time_minutes ? String(data.total_time_minutes) : "");
            setDifficulty(data.difficulty || "medium");
            setSource(data.source || "");
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
        setInstructions(prev => [...prev, { instruction: "", image_url: null }]);
    };

    const updateInstruction = (index: number, field: string, value: string | null) => {
        setInstructions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
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
                        servings: servings ? parseInt(servings) : null,
                        prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                        total_time_minutes: totalTime ? parseInt(totalTime) : null,
                        difficulty: difficulty || null,
                        source: source || null,
                        category_id: categoryId,
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


                let finalPrimary = primaryImage;
                let finalSecondary = secondaryImage;
                if (primaryImage && !primaryImage.startsWith("http") && user?.id) {
                    finalPrimary = await uploadImageToSupabase(primaryImage, "recipe-images", "primary", user.id);
                }
                if (secondaryImage && !secondaryImage.startsWith("http") && user?.id) {
                    finalSecondary = await uploadImageToSupabase(secondaryImage, "recipe-images", "secondary", user.id);
                }
                const finalInstructions = await Promise.all(instructions.map(async (inst) => {
                    let finalStepImg = inst.image_url;
                    if (finalStepImg && !finalStepImg.startsWith("http") && user?.id) {
                        finalStepImg = await uploadImageToSupabase(finalStepImg, "step-images", "steps", user.id);
                    }
                    return { ...inst, image_url: finalStepImg };
                }));

                // Delete old instructions and re-insert
                await supabase.from("recipe_steps").delete().eq("recipe_id", id);
                if (finalInstructions.length > 0) {
                    const mappedInstructions = finalInstructions.map((inst, idx) => ({
                        recipe_id: id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                        image_url: inst.image_url,
                    }));
                    const { error: instError } = await supabase
                        .from("recipe_steps")
                        .insert(mappedInstructions);
                    if (instError) console.error("Error saving instructions", instError);
                }

                const recipeIdToLink = id;

                // Link uploaded images
                await supabase.from("recipe_images").delete().eq("recipe_id", recipeIdToLink);
                const imagesToInsert = [];
                if (finalPrimary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalPrimary, is_primary: true });
                }
                if (finalSecondary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalSecondary, is_primary: false });
                }
                if (imagesToInsert.length > 0) {
                    await supabase.from("recipe_images").insert(imagesToInsert);
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

                // Delete old collections and re-insert
                await supabase.from("recipe_collections").delete().eq("recipe_id", recipeIdToLink);
                if (collectionId) {
                    const { error: colError } = await supabase.from("recipe_collections").insert([{ recipe_id: recipeIdToLink, collection_id: collectionId }]);
                    if (colError) console.error("Error saving collection", colError);
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
                        servings: servings ? parseInt(servings) : null,
                        prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                        total_time_minutes: totalTime ? parseInt(totalTime) : null,
                        difficulty: difficulty || null,
                        source: source || null,
                        category_id: categoryId,
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


                let finalPrimary = primaryImage;
                let finalSecondary = secondaryImage;
                if (primaryImage && !primaryImage.startsWith("http") && user?.id) {
                    finalPrimary = await uploadImageToSupabase(primaryImage, "recipe-images", "primary", user.id);
                }
                if (secondaryImage && !secondaryImage.startsWith("http") && user?.id) {
                    finalSecondary = await uploadImageToSupabase(secondaryImage, "recipe-images", "secondary", user.id);
                }
                const finalInstructions = await Promise.all(instructions.map(async (inst) => {
                    let finalStepImg = inst.image_url;
                    if (finalStepImg && !finalStepImg.startsWith("http") && user?.id) {
                        finalStepImg = await uploadImageToSupabase(finalStepImg, "step-images", "steps", user.id);
                    }
                    return { ...inst, image_url: finalStepImg };
                }));

                // Insert instructions
                if (finalInstructions.length > 0) {
                    const mappedInstructions = finalInstructions.map((inst, idx) => ({
                        recipe_id: newRecipe.id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                        image_url: inst.image_url,
                    }));
                    const { error: instError } = await supabase
                        .from("recipe_steps")
                        .insert(mappedInstructions);
                    if (instError) console.error("Error saving instructions", instError);
                }

                const recipeIdToLink = newRecipe.id;

                // Link uploaded images
                await supabase.from("recipe_images").delete().eq("recipe_id", recipeIdToLink);
                const imagesToInsert = [];
                if (finalPrimary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalPrimary, is_primary: true });
                }
                if (finalSecondary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalSecondary, is_primary: false });
                }
                if (imagesToInsert.length > 0) {
                    await supabase.from("recipe_images").insert(imagesToInsert);
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

                // Link collections
                if (collectionId) {
                    const { error: colError } = await supabase.from("recipe_collections").insert([{ recipe_id: recipeIdToLink, collection_id: collectionId }]);
                    if (colError) console.error("Error saving collection", colError);
                }

                await fetch(`${process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/analytics/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        eventName: 'recipe_created',
                        channel: 'mobile',
                        recipeId: newRecipe.id,
                        eventKey: newRecipe.id,
                        metadata: { source: source || null },
                    }),
                }).catch(() => undefined);

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
            <View className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg justify-center items-center">
                <WhiskLoader />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-dark-card dark:bg-dark-card border-b border-warm-gray-100 dark:border-dark-border dark:border-dark-border">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">
                    {isEdit ? t.recipes.editRecipe : t.add.addRecipeTitle}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-peach-500 px-4 py-2 rounded-full">
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEdit ? t.recipes.updateRecipe : t.common.save}</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-6" keyboardDismissMode="on-drag">

                {/* Success banner from scan */}
                {scanImageCount !== undefined && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            backgroundColor: '#dcfce7',
                            borderWidth: 1,
                            borderColor: '#86efac',
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            marginBottom: 20,
                        }}
                    >
                        <Sparkles color="#16a34a" size={20} />
                        <Text style={{ color: '#15803d', fontWeight: '600', fontSize: 14, flexShrink: 1 }}>
                            {Number(scanImageCount) > 0
                                ? ti('add.scanSuccessCount', { count: String(scanImageCount) })
                                : t.add.scanSuccess}
                        </Text>
                    </View>
                )}

                {/* Title */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.recipeTitle || "Title"}</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder={t.add.recipeTitle}
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-4 font-display text-xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text"
                    />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.description}</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder={t.recipes.description}
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-4 text-warm-gray-600 dark:text-dark-text dark:text-dark-text min-h-[100px] text-base leading-relaxed"
                        textAlignVertical="top"
                    />
                </View>

                {/* Time & Servings */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-3 uppercase text-xs tracking-wider">Time & Servings</Text>
                    <View className="flex-row gap-3 mb-3">
                        <View className="flex-1">
                            <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted text-xs mb-1.5">Servings</Text>
                            <TextInput
                                value={servings}
                                onChangeText={setServings}
                                placeholder="4"
                                keyboardType="number-pad"
                                className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-3 py-3 text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center text-base"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted text-xs mb-1.5">Prep (min)</Text>
                            <TextInput
                                value={prepTime}
                                onChangeText={setPrepTime}
                                placeholder="15"
                                keyboardType="number-pad"
                                className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-3 py-3 text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center text-base"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted text-xs mb-1.5">Cook (min)</Text>
                            <TextInput
                                value={cookTime}
                                onChangeText={setCookTime}
                                placeholder="30"
                                keyboardType="number-pad"
                                className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-3 py-3 text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center text-base"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted text-xs mb-1.5">Total (min)</Text>
                            <TextInput
                                value={totalTime}
                                onChangeText={setTotalTime}
                                placeholder="45"
                                keyboardType="number-pad"
                                className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-3 py-3 text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center text-base"
                            />
                        </View>
                    </View>
                </View>

                {/* Difficulty */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-3 uppercase text-xs tracking-wider">{t.recipes.difficulty || "Difficulty"}</Text>
                    <View className="flex-row gap-3">
                        {(["easy", "medium", "hard"] as const).map(level => (
                            <TouchableOpacity
                                key={level}
                                onPress={() => setDifficulty(level)}
                                className={`flex-1 py-3 rounded-xl border items-center ${difficulty === level ? 'bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle border-peach-300' : 'bg-white dark:bg-dark-card dark:bg-dark-card border-warm-gray-200'}`}
                            >
                                <Text className={`font-semibold capitalize text-sm ${difficulty === level ? 'text-peach-700' : 'text-warm-gray-500'}`}>
                                    {level === 'easy' ? (t.recipes.easy || 'Easy') : level === 'medium' ? (t.recipes.medium || 'Medium') : (t.recipes.hard || 'Hard')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Source */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{(t.recipes as any)?.source || "Source"}</Text>
                    <TextInput
                        value={source}
                        onChangeText={setSource}
                        placeholder="e.g. Mum, Grandma, Betty Bossi"
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-base"
                    />
                </View>

                {/* Collections */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{(t.recipes as any).collection || "Collection"}</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <TouchableOpacity
                            onPress={() => setCollectionId(null)}
                            className={`px-4 py-2 rounded-full border ${collectionId === null ? 'bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle border-peach-200' : 'bg-white dark:bg-dark-card dark:bg-dark-card border-warm-gray-200'}`}
                        >
                            <Text className={collectionId === null ? 'text-peach-700 font-medium' : 'text-warm-gray-600'}>None</Text>
                        </TouchableOpacity>
                        {collections.map((col) => (
                            <TouchableOpacity
                                key={col.id}
                                onPress={() => setCollectionId(col.id)}
                                className={`px-4 py-2 rounded-full border ${collectionId === col.id ? 'bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle border-peach-200' : 'bg-white dark:bg-dark-card dark:bg-dark-card border-warm-gray-200'}`}
                            >
                                <Text className={collectionId === col.id ? 'text-peach-700 font-medium' : 'text-warm-gray-600'}>{col.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Categories */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.category || "Category"}</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                                className={`px-4 py-2 rounded-full border flex-row items-center gap-1.5 ${categoryId === cat.id ? 'bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle border-peach-200' : 'bg-white dark:bg-dark-card dark:bg-dark-card border-warm-gray-200'}`}
                            >
                                <Text>{cat.icon}</Text>
                                <Text className={categoryId === cat.id ? 'text-peach-700 font-medium' : 'text-warm-gray-600'}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Photos */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{(t.recipes as any).recipePhotos || "Photos"}</Text>
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-[10px] tracking-wider h-8">Primary Photo</Text>
                            <ImageUpload
                                value={primaryImage}
                                onChange={setPrimaryImage}
                                aspectRatio="square"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-[10px] tracking-wider h-8">Secondary Photo (Optional)</Text>
                            <ImageUpload
                                value={secondaryImage}
                                onChange={setSecondaryImage}
                                aspectRatio="square"
                            />
                        </View>
                    </View>
                </View>

                {/* Tags */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{t.tags?.tags || "Tags"}</Text>
                    <RecipeTagsInput value={tags} onChange={setTags} />
                </View>

                {/* Ingredients */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">{t.recipes.ingredients}</Text>
                        <TouchableOpacity onPress={addIngredient} className="p-2 bg-peach-100 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-warm-gray-100 dark:border-dark-border dark:border-dark-border">
                        {ingredients.length === 0 ? (
                            <TouchableOpacity onPress={addIngredient} className="py-4 items-center">
                                <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted">{t.common.add} {t.recipes.ingredients.toLowerCase()}</Text>
                            </TouchableOpacity>
                        ) : (
                            ingredients.map((ing, idx) => (
                                <View key={idx} className="flex-row items-center py-2 border-b border-warm-gray-50 dark:border-dark-border dark:border-dark-border">
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
                                        className="w-14 text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted border-r border-warm-gray-100 dark:border-dark-border dark:border-dark-border mr-3"
                                    />
                                    <TextInput
                                        value={ing.name}
                                        onChangeText={(v) => updateIngredient(idx, "name", v)}
                                        placeholder={t.add.ingredientName}
                                        className="flex-1 text-warm-gray-700 dark:text-dark-text dark:text-dark-text"
                                    />
                                    <TouchableOpacity onPress={() => removeIngredient(idx)} className="p-2">
                                        <Trash2 color={colors.border} size={18} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Instructions */}
                <View className="mb-12">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="font-playfair text-2xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">{t.recipes.instructions}</Text>
                        <TouchableOpacity onPress={addInstruction} className="p-2 bg-peach-100 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle rounded-full">
                            <Plus color="#eb6e3e" size={20} />
                        </TouchableOpacity>
                    </View>
                    <View className="space-y-4">
                        {instructions.length === 0 ? (
                            <TouchableOpacity onPress={addInstruction} className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-warm-gray-100 dark:border-dark-border dark:border-dark-border items-center">
                                <Text className="text-warm-gray-400 dark:text-dark-muted dark:text-dark-muted">{t.common.add} {t.recipes.instructions.toLowerCase()}</Text>
                            </TouchableOpacity>
                        ) : (
                            instructions.map((step, idx) => (
                                <View key={idx} className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-warm-gray-100 dark:border-dark-border dark:border-dark-border flex-row">
                                    <View className="w-8 h-8 rounded-full bg-peach-100 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle items-center justify-center mr-3 mt-1">
                                        <Text className="text-peach-700 font-bold">{idx + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <TextInput
                                            value={step.instruction}
                                            onChangeText={(v) => updateInstruction(idx, "instruction", v)}
                                            multiline
                                            placeholder={t.add.instruction}
                                            className="text-warm-gray-600 dark:text-dark-text dark:text-dark-text text-base leading-relaxed min-h-[60px] mb-3"
                                        />
                                        <ImageUpload
                                            value={step.image_url}
                                            onChange={(url) => updateInstruction(idx, "image_url", url)}
                                            aspectRatio="video"
                                            label="Step Photo (Optional)"
                                            size="small"
                                        />
                                    </View>
                                    <TouchableOpacity onPress={() => removeInstruction(idx)} className="p-2">
                                        <Trash2 color={colors.border} size={18} />
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

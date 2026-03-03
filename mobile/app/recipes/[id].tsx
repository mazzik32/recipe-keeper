import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Clock, Users, ChefHat, Heart, Pencil, Trash2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useLanguage } from "../../contexts/LanguageContext";
import WhiskLoader from "../../components/WhiskLoader";
import { useFocusEffect } from "@react-navigation/native";

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadRecipe = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem(`recipe_detail_${id}`);
            if (cachedData) {
                setRecipe(JSON.parse(cachedData));
                setLoading(false);
            }
        } catch (e) {
            console.log("Failed to load recipe detail cache", e);
        }

        const { data, error } = await supabase
            .from("recipes")
            .select(`
              *, 
              images:recipe_images(*),
              ingredients:recipe_ingredients(*),
              instructions:recipe_steps(*),
              recipe_tags(tag:tags(*)),
              category:categories(*)
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error("Supabase Query Error:", error);
            setLoading(false);
        }

        if (data) {
            if (data.ingredients) {
                data.ingredients.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            }
            if (data.instructions) {
                data.instructions.sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0));
            }
            setRecipe(data);
            AsyncStorage.setItem(`recipe_detail_${id}`, JSON.stringify(data))
                .catch(e => console.log("Failed to save recipe detail cache", e));
            setLoading(false);
        }
    }, [id]);

    // Reload data when screen comes back into focus (e.g. after editing)
    useFocusEffect(
        useCallback(() => {
            loadRecipe();
        }, [loadRecipe])
    );

    const toggleFavorite = async () => {
        if (!recipe) return;

        const newStatus = !recipe.is_favorite;
        setRecipe({ ...recipe, is_favorite: newStatus });

        await supabase
            .from("recipes")
            .update({ is_favorite: newStatus })
            .eq("id", id);
    };

    const handleEdit = () => {
        router.push({
            pathname: "/recipes/recipe-form",
            params: { mode: "edit", id: id as string },
        });
    };

    const handleDelete = () => {
        Alert.alert(
            t.recipes.confirmDeleteTitle,
            t.recipes.confirmDeleteMessage,
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.recipes.deleteRecipe,
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from("recipes")
                            .update({ is_archived: true })
                            .eq("id", id);

                        if (error) {
                            Alert.alert(t.common.error, error.message);
                            return;
                        }

                        // Clear cache
                        try {
                            await AsyncStorage.removeItem(`recipe_detail_${id}`);
                        } catch (e) { }

                        router.replace("/(tabs)/");
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-cream justify-center items-center">
                <WhiskLoader />
            </View>
        );
    }

    if (!recipe) {
        return (
            <View className="flex-1 bg-cream justify-center items-center px-4">
                <Text className="text-warm-gray-600 text-lg">{t.errors.notFound}</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-peach-500 py-3 px-6 rounded-full">
                    <Text className="text-white font-semibold">{t.common.back}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const primaryImage = recipe.images?.find((img: any) => img.is_primary) || recipe.images?.[0];
    const secondaryImage = recipe.images?.find((img: any) => !img.is_primary);
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

    return (
        <View className="flex-1 bg-cream">
            {/* Back Button, Edit, Delete & Favorite Overlay */}
            <SafeAreaView edges={['top']} className="px-4 pt-2 pb-2 bg-peach-100 flex-row justify-between z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                >
                    <ArrowLeft color="#3d3632" size={20} />
                </TouchableOpacity>

                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={handleEdit}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                    >
                        <Pencil color="#3d3632" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDelete}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                    >
                        <Trash2 color="#e53e3e" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={toggleFavorite}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                    >
                        <Heart color="#eb6e3e" size={20} fill={recipe.is_favorite ? "#eb6e3e" : "transparent"} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View className="relative w-full aspect-square bg-peach-100">
                    {primaryImage ? (
                        <Image
                            source={primaryImage.image_url}
                            style={{ flex: 1, width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-6xl">🍽️</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View className="px-6 py-8 pb-20">
                    <Text className="font-playfair font-semibold text-3xl text-warm-gray-700 mb-4">{recipe.title}</Text>

                    {recipe.description && (
                        <Text className="text-warm-gray-500 text-base leading-relaxed mb-6">{recipe.description}</Text>
                    )}

                    {/* Tags & Categories */}
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {recipe.category && (
                            <View className="bg-peach-100 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                                <Text>{recipe.category.icon}</Text>
                                <Text className="text-peach-700 font-medium text-sm">{recipe.category.name}</Text>
                            </View>
                        )}
                        {recipe.recipe_tags && recipe.recipe_tags.map((rt: any, i: number) => {
                            const tag = rt.tag;
                            if (!tag) return null;
                            return (
                                <View key={i} className="bg-peach-100 px-3 py-1.5 rounded-full">
                                    <Text className="text-peach-700 font-medium text-sm">{tag.name}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Secondary Image */}
                    {secondaryImage && (
                        <View className="w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-warm-gray-100">
                            <Image
                                source={secondaryImage.image_url}
                                style={{ flex: 1, width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        </View>
                    )}

                    {/* Meta Info Bar */}
                    <View className="flex-row flex-wrap gap-x-6 gap-y-3 mb-8">
                        {recipe.prep_time_minutes > 0 || recipe.cook_time_minutes > 0 ? (
                            <View className="flex-row items-center gap-2">
                                <Clock color="#f8a888" size={20} />
                                <Text className="text-[14px] font-medium text-warm-gray-600">
                                    <Text className="font-semibold">{t.recipes.totalTime || "Time"}:</Text> {totalTime} min
                                </Text>
                            </View>
                        ) : null}

                        {recipe.servings ? (
                            <View className="flex-row items-center gap-2">
                                <Users color="#f8a888" size={20} />
                                <Text className="text-[14px] font-medium text-warm-gray-600">
                                    <Text className="font-semibold">{t.recipes.servings || "Serves"}:</Text> {recipe.servings}
                                </Text>
                            </View>
                        ) : null}

                        {recipe.difficulty ? (
                            <View className="flex-row items-center gap-2">
                                <ChefHat color="#f8a888" size={20} />
                                <Text className="text-[14px] font-medium text-warm-gray-600">
                                    <Text className="font-semibold">{t.recipes.difficulty || "Level"}:</Text> {recipe.difficulty}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Ingredients */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <View className="mb-8">
                            <Text className="font-playfair font-medium text-2xl text-warm-gray-700 mb-4">{t.recipes.ingredients}</Text>
                            <View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100">
                                {recipe.ingredients.map((ing: any, i: number) => (
                                    <View key={i} className="flex-row items-start py-1.5 px-1.5 gap-2">
                                        <View className="w-1.5 h-1.5 rounded-full bg-peach-300 mt-2.5 flex-shrink-0" />
                                        <Text className="flex-1 text-warm-gray-700 text-base leading-relaxed">
                                            {ing.quantity && (
                                                <Text className="font-bold text-warm-gray-700">
                                                    {ing.quantity} {ing.unit}{" "}
                                                </Text>
                                            )}
                                            {ing.name}
                                            {ing.notes && (
                                                <Text className="text-warm-gray-400">
                                                    {" "}
                                                    ({ing.notes})
                                                </Text>
                                            )}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Instructions */}
                    {recipe.instructions && recipe.instructions.length > 0 && (
                        <View>
                            <Text className="font-playfair font-medium text-2xl text-warm-gray-700 mb-4">{t.recipes.instructions}</Text>
                            <View className="flex-col">
                                {recipe.instructions.map((step: any, i: number) => (
                                    <View key={i} className="flex-row mb-6">
                                        <View className="w-8 h-8 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#FFCBA4' }}>
                                            <Text className="text-warm-gray-700 font-bold">{step.step_number}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-warm-gray-700 text-base leading-relaxed">
                                                {step.instruction}
                                            </Text>
                                            {step.image_url && (
                                                <Image
                                                    source={{ uri: step.image_url }}
                                                    style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginTop: 12 }}
                                                    contentFit="cover"
                                                />
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
            <StatusBar style="light" />
        </View>
    );
}


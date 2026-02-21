import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Clock, Users, Flame, Heart } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useLanguage } from "../../contexts/LanguageContext";

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRecipe() {
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
                  instructions:recipe_steps(*)
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Supabase Query Error:", error);
                setLoading(false);
            }

            if (data) {
                // Sort them locally to ensure order just in case
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
        }
        loadRecipe();
    }, [id]);

    const toggleFavorite = async () => {
        if (!recipe) return;

        // Optimistic update
        const newStatus = !recipe.is_favorite;
        setRecipe({ ...recipe, is_favorite: newStatus });

        await supabase
            .from("recipes")
            .update({ is_favorite: newStatus })
            .eq("id", id);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-cream justify-center items-center">
                <ActivityIndicator size="large" color="#eb6e3e" />
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
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

    return (
        <View className="flex-1 bg-cream">
            {/* Back Button & Favorite Overlay */}
            <SafeAreaView edges={['top']} className="px-4 pt-2 pb-2 bg-peach-100 flex-row justify-between z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                >
                    <ArrowLeft color="#3d3632" size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleFavorite}
                    className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                >
                    <Heart color="#eb6e3e" size={20} fill={recipe.is_favorite ? "#eb6e3e" : "transparent"} />
                </TouchableOpacity>
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
                    <Text className="font-playfair text-3xl text-warm-gray-700 mb-4">{recipe.title}</Text>

                    {recipe.description && (
                        <Text className="text-warm-gray-500 text-base leading-relaxed mb-6">{recipe.description}</Text>
                    )}

                    {/* Meta Info Bar */}
                    <View className="flex-row border-y border-warm-gray-200 py-4 mb-8 justify-around">
                        <View className="items-center">
                            <Clock color="#eb6e3e" size={24} className="mb-1" />
                            <Text className="text-warm-gray-600 font-semibold">{totalTime > 0 ? `${totalTime} min` : '-'}</Text>
                            <Text className="text-warm-gray-400 text-xs uppercase tracking-wider">{t.recipes.totalTime || "Time"}</Text>
                        </View>
                        <View className="items-center">
                            <Users color="#eb6e3e" size={24} className="mb-1" />
                            <Text className="text-warm-gray-600 font-semibold">{recipe.servings || '-'}</Text>
                            <Text className="text-warm-gray-400 text-xs uppercase tracking-wider">{t.recipes.servings || "Serves"}</Text>
                        </View>
                        <View className="items-center">
                            <Flame color="#eb6e3e" size={24} className="mb-1" />
                            <Text className="text-warm-gray-600 font-semibold">{recipe.difficulty || '-'}</Text>
                            <Text className="text-warm-gray-400 text-xs uppercase tracking-wider">{t.recipes.difficulty || "Level"}</Text>
                        </View>
                    </View>

                    {/* Ingredients */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <View className="mb-8">
                            <Text className="font-playfair text-2xl text-warm-gray-700 mb-4">{t.recipes.ingredients}</Text>
                            <View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-gray-100">
                                {recipe.ingredients.map((ing: any, i: number) => (
                                    <View key={i} className="flex-row py-2 border-b border-warm-gray-50 last:border-0">
                                        <Text className="w-24 font-semibold text-peach-600">{ing.quantity} {ing.unit}</Text>
                                        <Text className="flex-1 text-warm-gray-700">{ing.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Instructions */}
                    {recipe.instructions && recipe.instructions.length > 0 && (
                        <View>
                            <Text className="font-playfair text-2xl text-warm-gray-700 mb-4">{t.recipes.instructions}</Text>
                            <View className="space-y-6">
                                {recipe.instructions.map((step: any, i: number) => (
                                    <View key={i} className="flex-row">
                                        <View className="w-8 h-8 rounded-full bg-peach-100 items-center justify-center mr-4 mt-1">
                                            <Text className="text-peach-700 font-bold">{step.step_number}</Text>
                                        </View>
                                        <Text className="flex-1 text-warm-gray-600 text-base leading-relaxed pt-1">
                                            {step.instruction}
                                        </Text>
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

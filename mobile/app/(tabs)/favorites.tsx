import { View, Text, FlatList, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, Users, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import WhiskLoader from "../../components/WhiskLoader";
import { useTheme } from "../../contexts/ThemeContext";

export default function FavoritesScreen() {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();

    const loadFavorites = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const cachedData = await AsyncStorage.getItem(`recipes_favorites_${user.id}`);
            if (cachedData) {
                setRecipes(JSON.parse(cachedData));
                setLoading(false);
            }
        } catch (e) {
            console.log("Failed to load favorites cache", e);
        }

        const { data, error } = await supabase
            .from("recipes")
            .select(`*, images:recipe_images(*)`)
            .eq("user_id", user.id)
            .eq("is_favorite", true)
            .eq("is_archived", false)
            .order("created_at", { ascending: false });

        if (data) {
            setRecipes(data);
            AsyncStorage.setItem(`recipes_favorites_${user.id}`, JSON.stringify(data))
                .catch(e => console.log("Failed to save favorites cache", e));
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [user])
    );

    const toggleFavorite = async (id: string, currentStatus: boolean) => {
        // Optimistic UI update
        setRecipes(prev => prev.filter(r => r.id !== id));

        await supabase
            .from("recipes")
            .update({ is_favorite: !currentStatus })
            .eq("id", id);
    };

    const renderRecipe = ({ item }: { item: any }) => {
        const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
        const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);

        return (
            <Pressable
                onPress={() => router.push(`/recipes/${item.id}`)}
                className="bg-white dark:bg-dark-card rounded-2xl mb-4 overflow-hidden border border-warm-gray-100 dark:border-dark-border shadow-sm active:opacity-80"
            >
                <View className="aspect-[4/3] w-full relative bg-peach-100 dark:bg-dark-peach-subtle">
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
                            <Text className="text-4xl">🍽️</Text>
                        </View>
                    )}

                    <Pressable
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm z-10"
                        onPress={() => toggleFavorite(item.id, item.is_favorite)}
                    >
                        <Heart color="#eb6e3e" fill="#eb6e3e" size={20} />
                    </Pressable>
                </View>

                <View className="p-4">
                    <Text className="font-playfair text-xl text-warm-gray-700 dark:text-dark-text mb-2 truncate">{item.title}</Text>
                    <View className="flex-row items-center gap-4">
                        {totalTime > 0 && (
                            <View className="flex-row items-center gap-1.5">
                                <Clock color={colors.muted} size={14} />
                                <Text className="text-warm-gray-500 dark:text-dark-muted text-sm">{totalTime} min</Text>
                            </View>
                        )}
                        {item.servings && (
                            <View className="flex-row items-center gap-1.5">
                                <Users color={colors.muted} size={14} />
                                <Text className="text-warm-gray-500 dark:text-dark-muted text-sm">{item.servings}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-dark-bg">
            <View className="px-4 py-4 border-b border-warm-gray-100 dark:border-dark-border bg-white dark:bg-dark-card">
                <Text className="font-playfair text-3xl text-warm-gray-700 dark:text-dark-text">{t.nav.favorites}</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <WhiskLoader />
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecipe}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Heart color={colors.border} size={64} className="mb-4" />
                            <Text className="text-warm-gray-400 dark:text-dark-muted text-lg text-center">No favorites yet.</Text>
                            <Text className="text-warm-gray-400 dark:text-dark-muted text-sm mt-2 text-center">Tap the heart on a recipe to save it here.</Text>
                        </View>
                    }
                />
            )}
            <StatusBar style={isDark ? "light" : "dark"} />
        </SafeAreaView>
    );
}

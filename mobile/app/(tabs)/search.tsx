import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Search as SearchIcon, Clock, Users } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { useTheme } from "../../contexts/ThemeContext";

export default function SearchScreen() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();

    // Debounced search effect
    useEffect(() => {
        if (!user) return;

        if (query.trim().length === 0) {
            setResults([]);
            setLoading(false);
            return;
        }

        const searchTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("recipes")
                    .select(`*, images:recipe_images(*)`)
                    .eq("user_id", user.id)
                    .eq("is_archived", false)
                    .ilike("title", `%${query}%`)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (error) throw error;
                if (data) setResults(data);
            } catch (e) {
                // Fallback to local cache
                console.log("Search network error, falling back to local cache", e);
                const cachedData = await AsyncStorage.getItem(`recipes_master_${user.id}`);
                if (cachedData) {
                    const allRecipes = JSON.parse(cachedData);
                    const filtered = allRecipes.filter((r: any) =>
                        r.title?.toLowerCase().includes(query.toLowerCase()) ||
                        r.description?.toLowerCase().includes(query.toLowerCase())
                    ).slice(0, 20);
                    setResults(filtered);
                } else {
                    setResults([]);
                }
            } finally {
                setLoading(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(searchTimer);
    }, [query, user]);

    const renderRecipe = ({ item }: { item: any }) => {
        const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
        const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);

        return (
            <Pressable
                onPress={() => router.push(`/recipes/${item.id}`)}
                className="flex-row bg-white dark:bg-dark-card rounded-xl mb-3 overflow-hidden border border-warm-gray-100 dark:border-dark-border shadow-sm active:opacity-80 p-2"
            >
                <View className="w-20 h-20 bg-peach-100 dark:bg-dark-peach-subtle rounded-lg overflow-hidden">
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
                            <Text className="text-2xl">🍽️</Text>
                        </View>
                    )}
                </View>
                <View className="flex-1 ml-3 justify-center">
                    <Text className="font-playfair text-lg text-warm-gray-700 dark:text-dark-text mb-1" numberOfLines={1}>{item.title}</Text>
                    <View className="flex-row items-center gap-3">
                        {totalTime > 0 && (
                            <View className="flex-row items-center gap-1">
                                <Clock color={colors.muted} size={12} />
                                <Text className="text-warm-gray-400 dark:text-dark-muted text-xs">{totalTime} min</Text>
                            </View>
                        )}
                        {item.servings && (
                            <View className="flex-row items-center gap-1">
                                <Users color={colors.muted} size={12} />
                                <Text className="text-warm-gray-400 dark:text-dark-muted text-xs">{item.servings}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-dark-bg px-4">
            <View className="flex-row items-center bg-white dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border rounded-xl px-4 py-1 h-12 mb-6 mt-4">
                <SearchIcon color={colors.muted} size={20} />
                <TextInput
                    className="flex-1 ml-2 text-warm-gray-700 dark:text-dark-text h-full"
                    placeholder={t.search.searchRecipes}
                    placeholderTextColor={colors.muted}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    returnKeyType="search"
                />
            </View>

            {query.length > 0 && (
                <Text className="text-warm-gray-500 dark:text-dark-muted font-semibold mb-4 uppercase text-xs tracking-wider">
                    {results.length} Results
                </Text>
            )}

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="small" color="#eb6e3e" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecipe}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        query.length > 0 ? (
                            <View className="items-center py-10">
                                <Text className="text-warm-gray-500 dark:text-dark-muted text-center">No recipes found for "{query}".</Text>
                            </View>
                        ) : (
                            <View className="items-center py-10 mt-10">
                                <SearchIcon color={colors.border} size={48} className="mb-4" />
                                <Text className="text-warm-gray-400 dark:text-dark-muted text-center text-lg">Type above to find a recipe</Text>
                            </View>
                        )
                    }
                />
            )}
            <StatusBar style={isDark ? "light" : "dark"} />
        </SafeAreaView>
    );
}

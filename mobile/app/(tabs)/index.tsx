import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, Users } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [tags, setTags] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function loadRecipes() {
            if (!user) return;

            // 1. Try loading from cache first
            try {
                const cachedData = await AsyncStorage.getItem(`recipes_master_${user.id}`);
                if (cachedData) {
                    processRecipes(JSON.parse(cachedData), false);
                }
            } catch (e) {
                console.log("Failed to load recipes cache", e);
            }

            // 2. Fetch fresh data from Supabase
            const { data, error } = await supabase
                .from("recipes")
                .select(`
                    *, 
                    images:recipe_images(*),
                    recipe_tags(
                        tags(*)
                    )
                `)
                .eq("user_id", user.id)
                .eq("is_archived", false)
                .order("created_at", { ascending: false });

            if (data) {
                const formattedRecipes = data.map((recipe: any) => ({
                    ...recipe,
                    tags: recipe.recipe_tags?.map((rt: any) => rt.tags).filter(Boolean) || []
                }));

                processRecipes(formattedRecipes, true);

                // Save to cache
                AsyncStorage.setItem(`recipes_master_${user.id}`, JSON.stringify(formattedRecipes))
                    .catch(e => console.log("Failed to save recipes cache", e));
            } else {
                setLoading(false); // only hide loading if there was an error (if success, processRecipes does it)
            }
        }

        function processRecipes(formattedRecipes: any[], isFresh: boolean) {
            setRecipes(formattedRecipes);

            const counts = new Map<string, number>();
            const tagObjects = new Map<string, any>();

            formattedRecipes.forEach((recipe: any) => {
                recipe.tags.forEach((tag: any) => {
                    counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
                    tagObjects.set(tag.id, tag);
                });
            });

            const tagsWithCounts = Array.from(tagObjects.values()).map(tag => ({
                ...tag,
                count: counts.get(tag.id) || 0
            })).sort((a, b) => b.count - a.count);

            setTags(tagsWithCounts);
            setLoading(false);
        }

        loadRecipes();
    }, [user]);

    const filteredRecipes = selectedTagId
        ? recipes.filter(r => r.tags.some((t: any) => t.id === selectedTagId))
        : recipes;

    const renderRecipe = ({ item }: { item: any }) => {
        const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
        const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);

        return (
            <Pressable
                onPress={() => router.push(`/recipes/${item.id}`)}
                className="bg-white rounded-2xl mb-4 overflow-hidden border border-warm-gray-100 shadow-sm active:opacity-80"
            >
                <View className="aspect-[4/3] bg-peach-100 w-full relative">
                    {primaryImage ? (
                        <Image
                            source={primaryImage.image_url}
                            style={{ flex: 1, width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center">
                            <Text className="text-4xl">🍽️</Text>
                        </View>
                    )}
                </View>
                <View className="p-4">
                    <Text className="font-playfair text-xl text-warm-gray-700 mb-2 truncate">{item.title}</Text>
                    {item.description && (
                        <Text className="text-warm-gray-400 text-sm mb-3" numberOfLines={2}>{item.description}</Text>
                    )}

                    <View className="flex-row items-center gap-4">
                        {totalTime > 0 && (
                            <View className="flex-row items-center gap-1">
                                <Clock color="#b8b5b2" size={14} />
                                <Text className="text-warm-gray-400 text-xs">{totalTime} min</Text>
                            </View>
                        )}
                        {item.servings && (
                            <View className="flex-row items-center gap-1">
                                <Users color="#b8b5b2" size={14} />
                                <Text className="text-warm-gray-400 text-xs">{item.servings}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View className="flex-1 bg-cream px-4 pt-16">
            <Text className="font-playfair text-3xl text-warm-gray-700">{t.nav.myRecipes}</Text>
            <Text className="text-warm-gray-500 mt-1 mb-6">{t.recipes.dashboardSubtitle}</Text>

            {/* Tag Filter */}
            {tags.length > 0 && (
                <View className="mb-6 -mx-4">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedTagId(null)}
                            className={`px-4 py-2 rounded-full border ${selectedTagId === null ? 'bg-peach-500 border-peach-500' : 'bg-white border-warm-gray-200'}`}
                        >
                            <Text className={`font-medium ${selectedTagId === null ? 'text-white' : 'text-warm-gray-600'}`}>
                                {t.nav.allRecipes || "All Recipes"}
                            </Text>
                        </TouchableOpacity>

                        {tags.map(tag => (
                            <TouchableOpacity
                                key={tag.id}
                                onPress={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                                className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${selectedTagId === tag.id ? 'bg-peach-500 border-peach-500' : 'bg-white border-warm-gray-200'}`}
                            >
                                <Text className={`font-medium ${selectedTagId === tag.id ? 'text-white' : 'text-warm-gray-600'}`}>
                                    {tag.name}
                                </Text>
                                <View className={`px-1.5 py-0.5 rounded-full ${selectedTagId === tag.id ? 'bg-white/20' : 'bg-warm-gray-100'}`}>
                                    <Text className={`text-xs ${selectedTagId === tag.id ? 'text-white' : 'text-warm-gray-500'}`}>
                                        {tag.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#eb6e3e" />
                </View>
            ) : (
                <FlatList
                    data={filteredRecipes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecipe}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center py-10">
                            <Text className="text-warm-gray-500 text-center">{t.recipes.noRecipes}</Text>
                        </View>
                    }
                />
            )}
            <StatusBar style="auto" />
        </View>
    );
}

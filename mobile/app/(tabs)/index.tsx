import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView, TouchableOpacity, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, Users, Search, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Svg, { Path, Ellipse } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, withDelay } from "react-native-reanimated";
import LottieView from 'lottie-react-native';

const WhiskLoader = () => {
    return (
        <View className="flex-1 bg-cream items-center justify-center">
            <LottieView
                autoPlay
                loop
                style={{ width: 250, height: 250 }}
                source={require('../../assets/recipekeeper.json')}
            />
            <View className="flex-row gap-1.5 mt-5">
                {[0, 1, 2].map((i) => {
                    const dotOpacity = useSharedValue(0.3);
                    useEffect(() => {
                        dotOpacity.value = withDelay(
                            i * 200,
                            withRepeat(withTiming(1, { duration: 500 }), -1, true)
                        );
                    }, []);
                    const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));
                    return (
                        <Animated.View
                            key={i}
                            style={[
                                { width: 7, height: 7, borderRadius: 3.5, backgroundColor: i === 0 ? "#E07030" : i === 1 ? "#F0A830" : "#6B9A2A" },
                                dotStyle
                            ]}
                        />
                    );
                })}
            </View>
            <Text style={{ fontFamily: 'DancingScript_600SemiBold' }} className="text-warm-gray-400 mt-4 text-base">Rezepte werden geladen…</Text>
        </View>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [tags, setTags] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function loadRecipes() {
            if (!user) return;

            try {
                const cachedData = await AsyncStorage.getItem(`recipes_master_${user.id}`);
                if (cachedData) {
                    processRecipes(JSON.parse(cachedData), false);
                }
            } catch (e) {
                console.log("Failed to load recipes cache", e);
            }

            const offlineSettings = await AsyncStorage.getItem('settings_offline_storage');
            const isOfflineEnabled = offlineSettings === 'true';

            let selectQuery = `
                *, 
                images:recipe_images(*),
                recipe_tags(
                    tags(*)
                )
            `;

            if (isOfflineEnabled) {
                selectQuery += `,
                ingredients:recipe_ingredients(*),
                instructions:recipe_instructions(*)
                `;
            }

            const { data, error } = await supabase
                .from("recipes")
                .select(selectQuery)
                .eq("user_id", user.id)
                .eq("is_archived", false)
                .order("created_at", { ascending: false });

            if (data) {
                const formattedRecipes = data.map((recipe: any) => ({
                    ...recipe,
                    tags: recipe.recipe_tags?.map((rt: any) => rt.tags).filter(Boolean) || []
                }));

                processRecipes(formattedRecipes, true);
                AsyncStorage.setItem(`recipes_master_${user.id}`, JSON.stringify(formattedRecipes))
                    .catch(e => console.log("Failed to save recipes cache", e));

                if (isOfflineEnabled) {
                    formattedRecipes.forEach((recipe: any) => {
                        AsyncStorage.setItem(`recipe_detail_${recipe.id}`, JSON.stringify(recipe))
                            .catch(e => console.log("Failed to prepopulate detail cache", e));
                    });
                }
            } else {
                setLoading(false);
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
            // Artificial delay to show the nice new animation for a bit
            setTimeout(() => setLoading(false), 800);
        }

        loadRecipes();
    }, [user]);

    const filteredRecipes = recipes.filter(r => {
        const matchesTag = selectedTagId ? r.tags.some((t: any) => t.id === selectedTagId) : true;
        const matchesSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    const renderRecipe = ({ item, index }: { item: any, index: number }) => {
        const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
        const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);

        return (
            <Pressable
                onPress={() => router.push(`/recipes/${item.id}`)}
                className="bg-white rounded-[20px] mb-4 border border-warm-gray-100 flex-row p-4"
                style={({ pressed }) => [
                    {
                        shadowColor: "#e07030",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: pressed ? 0.08 : 0,
                        shadowRadius: 10,
                        elevation: pressed ? 3 : 0,
                        borderColor: pressed ? "#f5d5c6" : "#f5f4f3",
                        transform: [{ translateY: pressed ? -2 : 0 }]
                    }
                ]}
            >
                <View className="w-[96px] h-[96px] rounded-2xl bg-peach-50 items-center justify-center mr-5 shrink-0">
                    {primaryImage ? (
                        <Image
                            source={primaryImage.image_url}
                            style={{ width: '100%', height: '100%', borderRadius: 16 }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <Text className="text-3xl">🍽️</Text>
                    )}
                </View>

                <View className="flex-1 py-1 flex-col">
                    <Text className="font-playfair text-[17px] font-semibold text-warm-gray-700 mb-1" numberOfLines={2}>
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text className="text-peach-500 font-medium text-[14px] leading-[18px] mb-2.5 whitespace-nowrap overflow-hidden" numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}

                    <View className="flex-row flex-wrap gap-2 mt-auto">
                        {item.tags.slice(0, 2).map((t: any) => (
                            <View key={t.id} className="bg-peach-50 px-2.5 py-1 rounded-md">
                                <Text className="text-xs font-semibold text-peach-500">{t.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="flex-col items-end py-1 ml-2 gap-2.5 shrink-0">
                    {totalTime > 0 && (
                        <View className="flex-row items-center gap-1.5 justify-end">
                            <Clock color="#b8b5b2" size={14} />
                            <Text className="text-warm-gray-400 text-xs font-semibold">{totalTime} min</Text>
                        </View>
                    )}
                    {item.servings && (
                        <View className="flex-row items-center gap-1.5 justify-end">
                            <Users color="#b8b5b2" size={14} />
                            <Text className="text-warm-gray-400 text-xs font-semibold">{item.servings} P.</Text>
                        </View>
                    )}
                    <View className="mt-auto items-end">
                        <Heart fill={item.is_favorite ? "#e07030" : "none"} color={item.is_favorite ? "#e07030" : "#b8b5b2"} size={16} />
                    </View>
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return <WhiskLoader />;
    }

    return (
        <View className="flex-1 bg-cream">
            <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                renderItem={renderRecipe}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110 }}
                ListHeaderComponent={
                    <View className="mb-2">
                        {/* Header */}
                        <View className="pt-14 pb-4 flex-row justify-between items-start">
                            <View className="flex-row items-center gap-3">
                                <View>
                                    <Text style={{ fontFamily: 'Playfair Display' }} className="font-semibold text-peach-500 text-[18px]">
                                        {t.nav.myCollection || "Meine Sammlung"}
                                    </Text>
                                    <Text className="font-playfair text-[32px] font-bold text-warm-gray-700 leading-tight mt-0.5">
                                        {t.nav.familyRecipes || "Familienrezepte"}
                                    </Text>
                                </View>
                            </View>
                            <Image
                                source={require("../../assets/icon.png")}
                                style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#f5f4f3' }}
                            />
                        </View>

                        {/* Stats Row */}
                        <View className="flex-row gap-8 mb-8 mt-2 items-center">
                            <View>
                                <Text className="font-playfair text-[26px] font-bold text-peach-500" style={{ lineHeight: 30 }}>{recipes.length}</Text>
                                <Text className="text-warm-gray-400 text-[14px] font-medium tracking-tight">{t.recipes.recipes}</Text>
                            </View>
                            <View>
                                <Text className="font-playfair text-[26px] font-bold text-[#F0A830]" style={{ lineHeight: 30 }}>{tags.length}</Text>
                                <Text className="text-warm-gray-400 text-[14px] font-medium tracking-tight">{t.categories.title}</Text>
                            </View>
                        </View>

                        {/* Real Live-Filter Search Bar */}
                        <View className="flex-row items-center bg-peach-50 px-4 py-3.5 rounded-2xl border border-peach-100 mb-8 focus:border-peach-300">
                            <Search color="#ddd" size={20} />
                            <TextInput
                                className="ml-3 text-warm-gray-600 font-medium text-[16px] flex-1"
                                placeholder={t.search.searchRecipes}
                                placeholderTextColor="#999591"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                            />
                        </View>

                        {/* Collections / Tags */}
                        {tags.length > 0 && (
                            <View className="mb-6 -mx-5 px-5">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="font-playfair text-[22px] font-bold text-warm-gray-700">{t.categories.title}</Text>
                                    <TouchableOpacity onPress={() => setSelectedTagId(null)}>
                                        <Text className="text-peach-500 text-[14px] font-bold">{t.nav.allRecipes}</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingRight: 20, gap: 10 }}
                                >
                                    <TouchableOpacity
                                        onPress={() => setSelectedTagId(null)}
                                        className={`px-5 py-3 rounded-xl flex-row items-center gap-2.5 ${selectedTagId === null ? 'bg-peach-300' : 'bg-white border border-warm-gray-100'}`}
                                        style={selectedTagId === null ? { shadowColor: "#f8a888", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 } : {}}
                                    >
                                        <Text className="text-base">📖</Text>
                                        <Text className={`font-semibold text-[15px] ${selectedTagId === null ? 'text-white' : 'text-warm-gray-700'}`}>
                                            {t.nav.allRecipes}
                                        </Text>
                                        <View className={`px-2.5 py-1 rounded-md ${selectedTagId === null ? 'bg-white/20' : 'bg-warm-gray-100'}`}>
                                            <Text className={`text-[12px] font-bold ${selectedTagId === null ? 'text-white/80' : 'text-warm-gray-400'}`}>
                                                {recipes.length}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {tags.map(tag => (
                                        <TouchableOpacity
                                            key={tag.id}
                                            onPress={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                                            className={`px-5 py-3 rounded-xl flex-row items-center gap-2.5 ${selectedTagId === tag.id ? 'bg-peach-300' : 'bg-white border border-warm-gray-100'}`}
                                            style={selectedTagId === tag.id ? { shadowColor: "#f8a888", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 } : {}}
                                        >
                                            <Text className={`font-semibold text-[15px] ${selectedTagId === tag.id ? 'text-white' : 'text-warm-gray-700'}`}>
                                                {tag.name}
                                            </Text>
                                            <View className={`px-2.5 py-1 rounded-md ${selectedTagId === tag.id ? 'bg-white/20' : 'bg-warm-gray-100'}`}>
                                                <Text className={`text-[12px] font-bold ${selectedTagId === tag.id ? 'text-white/80' : 'text-warm-gray-400'}`}>
                                                    {tag.count}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* List Header stats */}
                        <View className="flex-row justify-between items-center mb-2 mt-3">
                            <Text className="text-warm-gray-400 font-medium text-[15px]">
                                {filteredRecipes.length} {t.recipes.recipes}
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center py-10">
                        <Text className="text-warm-gray-500 text-center">{t.recipes.noRecipes}</Text>
                    </View>
                }
            />
            <StatusBar style="auto" />
        </View>
    );
}

import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView, TouchableOpacity, TextInput, Modal, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, Users, Search, Heart, ChevronDown, Check, X, ChefHat } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, withSpring } from "react-native-reanimated";
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
    const router = useRouter();

    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Collection State
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [showCollectionPicker, setShowCollectionPicker] = useState(false);

    // Filtering State
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const persistReady = useRef(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<any>(null);

    // Animated search values
    const titleOpacity = useSharedValue(1);
    const titleTranslateX = useSharedValue(0);
    const searchOpacity = useSharedValue(0);
    const searchTranslateX = useSharedValue(40);

    const titleAnimStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateX: titleTranslateX.value }],
    }));
    const searchAnimStyle = useAnimatedStyle(() => ({
        opacity: searchOpacity.value,
        transform: [{ translateX: searchTranslateX.value }],
    }));

    const openSearch = () => {
        setIsSearchOpen(true);
        titleOpacity.value = withTiming(0, { duration: 150 });
        titleTranslateX.value = withTiming(-20, { duration: 150 });
        searchOpacity.value = withTiming(1, { duration: 200 });
        searchTranslateX.value = withSpring(0, { damping: 30, stiffness: 400 });
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const closeSearch = () => {
        setSearchQuery("");
        searchInputRef.current?.blur();
        titleOpacity.value = withTiming(1, { duration: 200 });
        titleTranslateX.value = withSpring(0, { damping: 30, stiffness: 400 });
        searchOpacity.value = withTiming(0, { duration: 150 });
        searchTranslateX.value = withTiming(40, { duration: 150 });
        setTimeout(() => setIsSearchOpen(false), 200);
    };

    // Load persisted selections on mount, then allow persist effects to run
    useEffect(() => {
        async function loadPersistedState() {
            try {
                const savedTag = await AsyncStorage.getItem('dashboard_selected_tag');
                if (savedTag) setSelectedTagId(savedTag);

                const savedCollection = await AsyncStorage.getItem('dashboard_selected_collection');
                if (savedCollection) setSelectedCollectionId(savedCollection);
            } catch (e) {
                console.log("Failed to load dashboard state", e);
            } finally {
                persistReady.current = true;
            }
        }
        loadPersistedState();
    }, []);

    // Persist selections on change — but only after initial load has completed
    useEffect(() => {
        if (!persistReady.current) return;
        if (selectedTagId) AsyncStorage.setItem('dashboard_selected_tag', selectedTagId);
        else AsyncStorage.removeItem('dashboard_selected_tag');
    }, [selectedTagId]);

    useEffect(() => {
        if (!persistReady.current) return;
        if (selectedCollectionId) AsyncStorage.setItem('dashboard_selected_collection', selectedCollectionId);
        else AsyncStorage.removeItem('dashboard_selected_collection');
    }, [selectedCollectionId]);

    const loadRecipes = useCallback(async () => {
        if (!user) return;

        try {
            const cachedData = await AsyncStorage.getItem(`recipes_master_${user.id}`);
            if (cachedData) setRecipes(JSON.parse(cachedData));
        } catch (e) {
            console.log("Failed to load recipes cache", e);
        }

        const offlineSettings = await AsyncStorage.getItem('settings_offline_storage');
        const isOfflineEnabled = offlineSettings === 'true';

        let selectQuery = `
            *, 
            images:recipe_images(*),
            recipe_tags(tags(*)),
            recipe_collections(collection_id)
        `;
        if (isOfflineEnabled) {
            selectQuery += `, ingredients:recipe_ingredients(*), instructions:recipe_instructions(*)`;
        }

        const { data, error } = await supabase
            .from("recipes")
            .select(selectQuery)
            .eq("user_id", user.id)
            .eq("is_archived", false)
            .order("created_at", { ascending: false });

        if (error) { console.error("Supabase Query Error:", error); return; }

        if (data) {
            const formattedRecipes = data.map((recipe: any) => ({
                ...recipe,
                tags: recipe.recipe_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
                collection_id: recipe.recipe_collections?.[0]?.collection_id || null
            }));

            setRecipes(formattedRecipes);
            AsyncStorage.setItem(`recipes_master_${user.id}`, JSON.stringify(formattedRecipes))
                .catch(e => console.log("Failed to save recipes cache", e));

            if (isOfflineEnabled) {
                formattedRecipes.forEach((recipe: any) => {
                    AsyncStorage.setItem(`recipe_detail_${recipe.id}`, JSON.stringify(recipe))
                        .catch(e => console.log("Failed to prepopulate detail cache", e));
                });
            }
        }
        setTimeout(() => setLoading(false), 800);
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadRecipes();
        setRefreshing(false);
    }, [loadRecipes]);

    useEffect(() => {
        async function loadCollections() {
            if (!user) return;
            const { data } = await supabase.from('collections').select('*').eq('user_id', user.id).order('name');
            if (data) setCollections(data);
        }
        loadCollections();
        loadRecipes();

        const channel = supabase
            .channel('public:recipes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'recipes', filter: `user_id=eq.${user?.id}` },
                () => { loadRecipes(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, loadRecipes]);

    // 1. Filter raw recipes down to the active collection (used for calculating tags accurately)
    const collectionRecipes = useMemo(() => {
        return recipes.filter(r => !selectedCollectionId || r.collection_id === selectedCollectionId);
    }, [recipes, selectedCollectionId]);

    // 2. Compute tags dynamically based on the active collection
    const tags = useMemo(() => {
        const counts = new Map<string, number>();
        const tagObjects = new Map<string, any>();

        collectionRecipes.forEach((recipe: any) => {
            recipe.tags.forEach((tag: any) => {
                counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
                tagObjects.set(tag.id, tag);
            });
        });

        // Auto-deselect tag if it's no longer valid in the new collection
        if (selectedTagId && !counts.has(selectedTagId)) {
            setSelectedTagId(null);
        }

        return Array.from(tagObjects.values()).map(tag => ({
            ...tag,
            count: counts.get(tag.id) || 0
        })).sort((a, b) => b.count - a.count);
    }, [collectionRecipes]);

    // 3. Final visual list filtered by tag and text search
    const filteredRecipes = useMemo(() => {
        return collectionRecipes.filter(r => {
            const matchesTag = selectedTagId ? r.tags.some((t: any) => t.id === selectedTagId) : true;
            const matchesSearch = r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTag && matchesSearch;
        });
    }, [collectionRecipes, selectedTagId, searchQuery]);

    const renderRecipe = ({ item, index }: { item: any, index: number }) => {
        const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0];
        const totalTime = item.total_time_minutes || ((item.prep_time_minutes || 0) + (item.cook_time_minutes || 0));

        return (
            <Pressable
                onPress={() => router.push(`/recipes/${item.id}`)}
                className="bg-white rounded-[20px] mb-4 border border-warm-gray-100 p-4"
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
                {/* Row 1: meta — full width */}
                <View className="flex-row items-center mb-2">
                    {totalTime > 0 && (
                        <View className="flex-row items-center gap-1 mr-3">
                            <Clock color="#b8b5b2" size={13} />
                            <Text className="text-warm-gray-400 text-xs font-semibold">{totalTime} min</Text>
                        </View>
                    )}
                    {item.servings && (
                        <View className="flex-row items-center gap-1 mr-3">
                            <Users color="#b8b5b2" size={13} />
                            <Text className="text-warm-gray-400 text-xs font-semibold">{item.servings} P.</Text>
                        </View>
                    )}
                    {item.difficulty && (
                        <View className="flex-row items-center gap-1">
                            <ChefHat color="#b8b5b2" size={13} />
                            <Text className="text-warm-gray-400 text-xs font-semibold capitalize">{item.difficulty}</Text>
                        </View>
                    )}
                    <View className="ml-auto">
                        <Heart fill={item.is_favorite ? "#e07030" : "none"} color={item.is_favorite ? "#e07030" : "#b8b5b2"} size={15} />
                    </View>
                </View>

                {/* Row 2: image + title/description side-by-side */}
                <View className="flex-row items-end">
                    <View className="w-[88px] h-[88px] rounded-2xl bg-peach-50 items-center justify-center mr-4 shrink-0">
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
                    <View className="flex-1">
                        <Text className="font-playfair text-[17px] font-semibold text-warm-gray-700 mb-1" numberOfLines={2}>
                            {item.title}
                        </Text>
                        {item.description && (
                            <Text className="text-peach-500 font-medium text-[13px] leading-[18px]" numberOfLines={2}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Row 3: tags — full width */}
                {item.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-2.5">
                        {item.tags.slice(0, 2).map((t: any) => (
                            <View key={t.id} className="bg-peach-50 px-2.5 py-1 rounded-md">
                                <Text className="text-xs font-semibold text-peach-500">{t.name}</Text>
                            </View>
                        ))}
                    </View>
                )}
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eb6e3e" />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110 }}
                ListHeaderComponent={
                    <View className="mb-2">
                        {/* Header: animated title ↔ search */}
                        <SafeAreaView edges={['top']} className="bg-cream">
                            {/* Fixed height container — must be tall enough for 3-line title block */}
                            <View style={{ height: 112, marginBottom: 8 }}>
                                {/* Title row — fades/slides out when search opens */}
                                <Animated.View
                                    style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, titleAnimStyle]}
                                    pointerEvents={isSearchOpen ? 'none' : 'auto'}
                                >
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        {/* Left: title block */}
                                        <TouchableOpacity onPress={() => setShowCollectionPicker(true)} style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: 'Playfair Display', fontWeight: '600', color: '#eb6e3e', fontSize: 16, marginBottom: 2 }}>
                                                {t.nav.myCollection || "Meine Sammlung"}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                <Text style={{ fontFamily: 'Playfair Display', fontSize: 30, fontWeight: '700', color: '#3d3632', lineHeight: 36 }} numberOfLines={1}>
                                                    {selectedCollectionId
                                                        ? collections.find(c => c.id === selectedCollectionId)?.name
                                                        : (t.nav.allRecipes || "All my recipes")
                                                    }
                                                </Text>
                                                <ChevronDown color="#3d3632" size={22} />
                                            </View>
                                            <Text style={{ color: '#a09b96', fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                                                {collectionRecipes.length} {t.recipes.recipes.toLowerCase()} · {tags.length} {t.categories.title.toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                        {/* Right: icons — aligned to top, spaced from title */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12, paddingTop: 4 }}>
                                            <TouchableOpacity
                                                onPress={openSearch}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                style={{ padding: 8, borderRadius: 20, backgroundColor: '#fdf1ec' }}
                                            >
                                                <Search color="#eb6e3e" size={19} />
                                            </TouchableOpacity>
                                            <Image
                                                source={require("../../assets/icon.png")}
                                                style={{ width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#f0eeec' }}
                                            />
                                        </View>
                                    </View>
                                </Animated.View>

                                {/* Search bar — springs in from the right when search opens */}
                                <Animated.View
                                    style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center' }, searchAnimStyle]}
                                    pointerEvents={isSearchOpen ? 'auto' : 'none'}
                                >
                                    <View
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f5c8b4', borderRadius: 18, paddingHorizontal: 14, height: 50, shadowColor: '#e07030', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}
                                    >
                                        <Search color="#eb6e3e" size={18} />
                                        <TextInput
                                            ref={searchInputRef}
                                            style={{ flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', color: '#3d3632' }}
                                            placeholder={t.search.searchRecipes}
                                            placeholderTextColor="#c4bfbb"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            returnKeyType="search"
                                            autoCorrect={false}
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#e8e4e0', alignItems: 'center', justifyContent: 'center' }}>
                                                    <X color="#75716d" size={12} />
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <TouchableOpacity onPress={closeSearch} style={{ marginLeft: 12, paddingVertical: 8 }}>
                                        <Text style={{ color: '#eb6e3e', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </SafeAreaView>


                        {/* Collections / Tags */}
                        {tags.length > 0 && (
                            <View className="mb-6 -mx-5 px-5">
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
                                                {collectionRecipes.length}
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
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center py-10">
                        <Text className="text-warm-gray-500 text-center">{t.recipes.noRecipes}</Text>
                    </View>
                }
            />

            {/* Collection Picker Modal */}
            <Modal visible={showCollectionPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCollectionPicker(false)}>
                <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
                    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-warm-gray-100 shadow-sm z-10">
                        <View className="w-10" />
                        <Text className="font-playfair text-xl text-warm-gray-700 font-semibold text-center flex-1">Select Collection</Text>
                        <TouchableOpacity onPress={() => setShowCollectionPicker(false)} className="w-10 items-end pr-2 py-2">
                            <X color="#75716d" size={24} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
                        <TouchableOpacity
                            onPress={() => { setSelectedCollectionId(null); setShowCollectionPicker(false); }}
                            className={`p-5 rounded-2xl mb-3 flex-row items-center justify-between ${!selectedCollectionId ? 'bg-peach-100 border border-peach-200' : 'bg-white border border-warm-gray-100'}`}
                            style={!selectedCollectionId ? { shadowColor: '#e07030', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : {}}
                        >
                            <Text className={`font-semibold text-[17px] ${!selectedCollectionId ? 'text-peach-700' : 'text-warm-gray-700'}`}>{t.nav.allRecipes || "All my recipes"}</Text>
                            {!selectedCollectionId && <Check color="#eb6e3e" size={22} />}
                        </TouchableOpacity>

                        {collections.map(col => (
                            <TouchableOpacity
                                key={col.id}
                                onPress={() => { setSelectedCollectionId(col.id); setShowCollectionPicker(false); }}
                                className={`p-5 rounded-2xl mb-3 flex-row items-center justify-between ${selectedCollectionId === col.id ? 'bg-peach-100 border border-peach-200' : 'bg-white border border-warm-gray-100'}`}
                                style={selectedCollectionId === col.id ? { shadowColor: '#e07030', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : {}}
                            >
                                <Text className={`font-semibold text-[17px] ${selectedCollectionId === col.id ? 'text-peach-700' : 'text-warm-gray-700'}`}>{col.name}</Text>
                                {selectedCollectionId === col.id && <Check color="#eb6e3e" size={22} />}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={() => { setShowCollectionPicker(false); router.push('/(tabs)/settings/collections'); }}
                            className="mt-6 p-4 items-center"
                        >
                            <Text className="text-peach-500 font-semibold">{(t as any).collections?.manageCollections || "Manage Collections"}...</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <StatusBar style="auto" />
        </View>
    );
}

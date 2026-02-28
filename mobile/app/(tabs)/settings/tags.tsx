import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Tag as TagIcon, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Tag } from "../../../components/RecipeTagsInput";

interface TagWithCount extends Tag {
    recipe_count: number;
}

export default function TagsManagementScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [tags, setTags] = useState<TagWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadTags();
    }, [user]);

    const loadTags = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('tags')
            .select(`
                *,
                recipe_tags(count)
            `)
            .eq('user_id', user.id)
            .order('name');

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else if (data) {
            const formattedTags = data.map((tag: any) => ({
                ...tag,
                recipe_count: tag.recipe_tags?.[0]?.count || 0
            }));
            setTags(formattedTags);
        }
        setLoading(false);
    };

    const handleDelete = async (tag: TagWithCount) => {
        Alert.alert(
            t.tags?.tagDeleted || "Delete Tag",
            (t.tags?.tagDeletedDesc || "{name} will be deleted").replace("{name}", tag.name),
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.common.delete || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeletingId(tag.id);

                        // Delete recipe_tags links first
                        await supabase.from("recipe_tags").delete().eq("tag_id", tag.id);

                        // Then delete the tag itself
                        const { error } = await supabase.from("tags").delete().eq("id", tag.id);

                        if (error) {
                            Alert.alert(t.common.error, error.message);
                        } else {
                            setTags(prev => prev.filter(t => t.id !== tag.id));
                        }

                        setDeletingId(null);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream">
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-warm-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft color="#75716d" size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-700">{t.tags?.manageTags || "Manage Tags"}</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#eb6e3e" />
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-6">
                    {tags.length === 0 ? (
                        <View className="py-12 items-center">
                            <TagIcon color="#dfd8d3" size={64} className="mb-4" />
                            <Text className="text-warm-gray-500 text-center px-8 text-lg">
                                {t.tags?.noTags || "No tags yet. Create tags while adding or editing recipes."}
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                            {tags.map((tag, index) => (
                                <View
                                    key={tag.id}
                                    className={`flex-row items-center justify-between p-4 bg-white ${index !== tags.length - 1 ? 'border-b border-warm-gray-50' : ''}`}
                                >
                                    <View className="flex-1 flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-full bg-peach-50 items-center justify-center">
                                            <TagIcon color="#eb6e3e" size={20} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-warm-gray-700 font-medium text-base mb-0.5">{tag.name}</Text>
                                            <Text className="text-warm-gray-500 text-sm">
                                                {(t.tags?.tagUsedBy || "Used by {count} recipe(s)").replace("{count}", tag.recipe_count.toString())}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(tag)}
                                        disabled={deletingId === tag.id}
                                        className="p-3 ml-2"
                                    >
                                        {deletingId === tag.id ? (
                                            <ActivityIndicator size="small" color="#ef4444" />
                                        ) : (
                                            <Trash2 color="#dfd8d3" size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            )}
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

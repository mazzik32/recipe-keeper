import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Tag as TagIcon, Trash2, Edit2, Plus, Save, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Tag } from "../../../components/RecipeTagsInput";
import WhiskLoader from "../../../components/WhiskLoader";

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

    // Create State
    const [newTagName, setNewTagName] = useState("");
    const [creating, setCreating] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

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
                recipe_tags(tag_id)
            `)
            .eq('user_id', user.id)
            .order('name');

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else if (data) {
            const formattedTags = data.map((tag: any) => ({
                ...tag,
                recipe_count: tag.recipe_tags?.length || 0
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

    const handleCreate = async () => {
        const cleanName = newTagName.trim();
        if (!cleanName || !user) return;

        // Check if exists
        if (tags.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
            Alert.alert(t.common.error, t.tags?.tagExists || "A tag with this name already exists");
            return;
        }

        setCreating(true);
        const { data, error } = await supabase
            .from("tags")
            .insert({ name: cleanName, user_id: user.id })
            .select()
            .single();

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else if (data) {
            const newTag = { ...data, recipe_count: 0 } as TagWithCount;
            setTags(prev => [newTag, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            setNewTagName("");
        }
        setCreating(false);
    };

    const startEditing = (tag: TagWithCount) => {
        setEditingId(tag.id);
        setEditName(tag.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
    };

    const handleEditSave = async (tag: TagWithCount) => {
        const cleanName = editName.trim();
        if (!cleanName || cleanName === tag.name) {
            cancelEditing();
            return;
        }

        // Check if exists (excluding self)
        if (tags.some(t => t.id !== tag.id && t.name.toLowerCase() === cleanName.toLowerCase())) {
            Alert.alert(t.common.error, t.tags?.tagExists || "A tag with this name already exists");
            return;
        }

        setSavingId(tag.id);
        const { error } = await supabase
            .from("tags")
            .update({ name: cleanName })
            .eq("id", tag.id);

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else {
            setTags(prev => prev.map(t => t.id === tag.id ? { ...t, name: cleanName } : t).sort((a, b) => a.name.localeCompare(b.name)));
            setEditingId(null);
        }
        setSavingId(null);
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg">
            <View className="flex-row items-center px-4 py-3 bg-white dark:bg-dark-card dark:bg-dark-card border-b border-warm-gray-100 dark:border-dark-border dark:border-dark-border">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft color="#75716d" size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">{t.tags?.manageTags || "Manage Tags"}</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <WhiskLoader />
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
                    {/* Create New Tag Input */}
                    <View className="flex-row items-center bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl border border-warm-gray-200 dark:border-dark-border dark:border-dark-border px-4 py-3 mb-6 shadow-sm">
                        <TextInput
                            value={newTagName}
                            onChangeText={setNewTagName}
                            placeholder={t.tags?.newTagName || "New tag name..."}
                            className="flex-1 text-base text-warm-gray-700 dark:text-dark-text dark:text-dark-text h-8"
                            onSubmitEditing={handleCreate}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={!newTagName.trim() || creating}
                            className={`ml-3 p-2 rounded-full ${newTagName.trim() ? 'bg-peach-500' : 'bg-warm-gray-100'}`}
                        >
                            {creating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Plus color={newTagName.trim() ? "#fff" : "#a8a29e"} size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {tags.length === 0 ? (
                        <View className="py-8 items-center">
                            <TagIcon color="#dfd8d3" size={64} className="mb-4" />
                            <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center px-8 text-lg">
                                {t.tags?.noTags || "No tags yet. Create your first tag above."}
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl border border-warm-gray-100 dark:border-dark-border dark:border-dark-border overflow-hidden shadow-sm">
                            {tags.map((tag, index) => {
                                const isEditing = editingId === tag.id;
                                return (
                                    <View
                                        key={tag.id}
                                        className={`flex-row items-center justify-between p-4 bg-white dark:bg-dark-card dark:bg-dark-card ${index !== tags.length - 1 ? 'border-b border-warm-gray-50' : ''}`}
                                    >
                                        <View className="flex-1 flex-row items-center gap-3">
                                            <View className="w-10 h-10 rounded-full bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle items-center justify-center">
                                                <TagIcon color="#eb6e3e" size={20} />
                                            </View>
                                            <View className="flex-1">
                                                {isEditing ? (
                                                    <TextInput
                                                        value={editName}
                                                        onChangeText={setEditName}
                                                        className="text-base text-warm-gray-700 dark:text-dark-text dark:text-dark-text font-medium py-1 px-2 -ml-2 bg-warm-gray-50 dark:bg-dark-elevated dark:bg-dark-elevated rounded border border-peach-200"
                                                        autoFocus
                                                        onSubmitEditing={() => handleEditSave(tag)}
                                                        returnKeyType="done"
                                                    />
                                                ) : (
                                                    <>
                                                        <Text className="text-warm-gray-700 dark:text-dark-text dark:text-dark-text font-medium text-base mb-0.5">{tag.name}</Text>
                                                        <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-sm">
                                                            {(t.tags?.tagUsedBy || "Used by {count} recipe(s)").replace("{count}", tag.recipe_count.toString())}
                                                        </Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>

                                        <View className="flex-row items-center ml-2">
                                            {isEditing ? (
                                                <>
                                                    <TouchableOpacity onPress={cancelEditing} className="p-2 mr-1">
                                                        <X color="#a8a29e" size={20} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleEditSave(tag)} disabled={savingId === tag.id} className="p-2 bg-peach-100 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle rounded-full">
                                                        {savingId === tag.id ? <ActivityIndicator size="small" color="#eb6e3e" /> : <Save color="#eb6e3e" size={18} />}
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity onPress={() => startEditing(tag)} className="p-2 mr-1">
                                                        <Edit2 color="#a8a29e" size={20} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDelete(tag)}
                                                        disabled={deletingId === tag.id}
                                                        className="p-2"
                                                    >
                                                        {deletingId === tag.id ? (
                                                            <ActivityIndicator size="small" color="#ef4444" />
                                                        ) : (
                                                            <Trash2 color="#dfd8d3" size={20} />
                                                        )}
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            )}
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

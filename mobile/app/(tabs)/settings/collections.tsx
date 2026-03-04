import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, FolderOpen, Trash2, Edit2, Plus, Save, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import WhiskLoader from "../../../components/WhiskLoader";

interface CollectionWithCount {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    recipe_count: number;
}

export default function CollectionsManagementScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [collections, setCollections] = useState<CollectionWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Create State
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        loadCollections();
    }, [user]);

    const loadCollections = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('collections')
            .select(`
                *,
                recipes(id)
            `)
            .eq('user_id', user.id)
            .order('name');

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else if (data) {
            const formatted = data.map((col: any) => ({
                ...col,
                recipe_count: col.recipes?.length || 0
            }));
            setCollections(formatted);
        }
        setLoading(false);
    };

    const handleDelete = async (collection: CollectionWithCount) => {
        Alert.alert(
            "Delete Collection",
            `Are you sure you want to delete "${collection.name}"? Recipes inside will NOT be deleted, but will be removed from this collection.`,
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.common.delete || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeletingId(collection.id);

                        // Delete the collection (recipe_collections handles cascade)
                        const { error } = await supabase.from("collections").delete().eq("id", collection.id);

                        if (error) {
                            Alert.alert(t.common.error, error.message);
                        } else {
                            setCollections(prev => prev.filter(c => c.id !== collection.id));
                        }

                        setDeletingId(null);
                    }
                }
            ]
        );
    };

    const handleCreate = async () => {
        const cleanName = newName.trim();
        if (!cleanName || !user) return;

        // Check if exists
        if (collections.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            Alert.alert(t.common.error, "A collection with this name already exists");
            return;
        }

        setCreating(true);
        const { data, error } = await supabase
            .from("collections")
            .insert({ name: cleanName, user_id: user.id })
            .select()
            .single();

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else if (data) {
            const newCol = { ...data, recipe_count: 0 } as CollectionWithCount;
            setCollections(prev => [newCol, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName("");
        }
        setCreating(false);
    };

    const startEditing = (collection: CollectionWithCount) => {
        setEditingId(collection.id);
        setEditName(collection.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
    };

    const handleEditSave = async (collection: CollectionWithCount) => {
        const cleanName = editName.trim();
        if (!cleanName || cleanName === collection.name) {
            cancelEditing();
            return;
        }

        if (collections.some(c => c.id !== collection.id && c.name.toLowerCase() === cleanName.toLowerCase())) {
            Alert.alert(t.common.error, "A collection with this name already exists");
            return;
        }

        setSavingId(collection.id);
        const { error } = await supabase
            .from("collections")
            .update({ name: cleanName })
            .eq("id", collection.id);

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else {
            setCollections(prev => prev.map(c => c.id === collection.id ? { ...c, name: cleanName } : c).sort((a, b) => a.name.localeCompare(b.name)));
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
                <Text className="font-playfair text-xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">Manage Collections</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <WhiskLoader />
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
                    <View className="flex-row items-center bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl border border-warm-gray-200 dark:border-dark-border dark:border-dark-border px-4 py-3 mb-6 shadow-sm">
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="New collection name..."
                            className="flex-1 text-base text-warm-gray-700 dark:text-dark-text dark:text-dark-text h-8"
                            onSubmitEditing={handleCreate}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={!newName.trim() || creating}
                            className={`ml-3 p-2 rounded-full ${newName.trim() ? 'bg-peach-500' : 'bg-warm-gray-100'}`}
                        >
                            {creating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Plus color={newName.trim() ? "#fff" : "#a8a29e"} size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {collections.length === 0 ? (
                        <View className="py-8 items-center">
                            <FolderOpen color="#dfd8d3" size={64} className="mb-4" />
                            <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center px-8 text-lg">
                                No collections yet. Create your first collection above.
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl border border-warm-gray-100 dark:border-dark-border dark:border-dark-border overflow-hidden shadow-sm">
                            {collections.map((col, index) => {
                                const isEditing = editingId === col.id;
                                return (
                                    <View
                                        key={col.id}
                                        className={`flex-row items-center justify-between p-4 bg-white dark:bg-dark-card dark:bg-dark-card ${index !== collections.length - 1 ? 'border-b border-warm-gray-50' : ''}`}
                                    >
                                        <View className="flex-1 flex-row items-center gap-3">
                                            <View className="w-10 h-10 rounded-full bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle items-center justify-center">
                                                <FolderOpen color="#eb6e3e" size={20} />
                                            </View>
                                            <View className="flex-1">
                                                {isEditing ? (
                                                    <TextInput
                                                        value={editName}
                                                        onChangeText={setEditName}
                                                        className="text-base text-warm-gray-700 dark:text-dark-text dark:text-dark-text font-medium py-1 px-2 -ml-2 bg-warm-gray-50 dark:bg-dark-elevated dark:bg-dark-elevated rounded border border-peach-200"
                                                        autoFocus
                                                        onSubmitEditing={() => handleEditSave(col)}
                                                        returnKeyType="done"
                                                    />
                                                ) : (
                                                    <>
                                                        <Text className="text-warm-gray-700 dark:text-dark-text dark:text-dark-text font-medium text-base mb-0.5">{col.name}</Text>
                                                        <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-sm">
                                                            {col.recipe_count} recipe{col.recipe_count !== 1 && "s"}
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
                                                    <TouchableOpacity onPress={() => handleEditSave(col)} disabled={savingId === col.id} className="p-2 bg-peach-100 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle rounded-full">
                                                        {savingId === col.id ? <ActivityIndicator size="small" color="#eb6e3e" /> : <Save color="#eb6e3e" size={18} />}
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity onPress={() => startEditing(col)} className="p-2 mr-1">
                                                        <Edit2 color="#a8a29e" size={20} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDelete(col)}
                                                        disabled={deletingId === col.id}
                                                        className="p-2"
                                                    >
                                                        {deletingId === col.id ? (
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

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { X, Plus, Tag as TagIcon, Check } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export interface Tag {
    id: string;
    name: string;
    user_id: string;
}

interface RecipeTagsInputProps {
    value: Tag[]; // Array of selected tags
    onChange: (tags: Tag[]) => void;
}

export function RecipeTagsInput({ value, onChange }: RecipeTagsInputProps) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [creating, setCreating] = useState(false);

    // Fetch existing tags on mount
    useEffect(() => {
        async function fetchTags() {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from("tags")
                .select("*")
                .eq("user_id", user.id)
                .order("name");

            if (!error && data) {
                setAllTags(data);
            }
            setLoading(false);
        }
        fetchTags();
    }, [user]);

    const handleSelectTag = (tag: Tag) => {
        const isSelected = value.some(t => t.id === tag.id);
        if (isSelected) {
            onChange(value.filter(t => t.id !== tag.id));
        } else {
            onChange([...value, tag]);
        }
        setSearchText("");
    };

    const handleCreateTag = async () => {
        const cleanName = searchText.trim();
        if (!cleanName || !user) return;

        // Check if exists locally
        const existing = allTags.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
            if (!value.some(t => t.id === existing.id)) {
                onChange([...value, existing]);
            }
            setSearchText("");
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
            const newTag = data as Tag;
            // Update local list and maintain alphabetical sort
            setAllTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
            onChange([...value, newTag]);
            setSearchText("");
        }
        setCreating(false);
    };

    const removeTag = (tagId: string) => {
        onChange(value.filter(t => t.id !== tagId));
    };

    // Filter tags for the dropdown based on search text
    const filteredTags = allTags.filter(t =>
        t.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // Show create button if we have text and no exact match
    const showCreateButton = searchText.trim().length > 0 &&
        !allTags.some(t => t.name.toLowerCase() === searchText.trim().toLowerCase());

    return (
        <View>
            {/* Selected Tags Display */}
            <View className="flex-row flex-wrap gap-2 mb-3">
                {value.map(tag => (
                    <View key={tag.id} className="bg-peach-100 flex-row items-center px-3 py-1.5 rounded-full">
                        <Text className="text-peach-700 font-medium mr-1">{tag.name}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag.id)} className="p-1">
                            <X color="#eb6e3e" size={14} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Trigger Button */}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="border border-warm-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center bg-white"
            >
                <Text className="text-warm-gray-500">{t.tags?.addTag || "+ Add Tag"}</Text>
                <TagIcon color="#a8a29e" size={20} />
            </TouchableOpacity>

            {/* Tag Selection Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1 bg-cream"
                >
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-warm-gray-100">
                        <Text className="font-playfair text-xl text-warm-gray-700">{t.tags?.tags || "Tags"}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                            <Text className="text-peach-600 font-semibold">{t.common.done}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search / Create Input */}
                    <View className="p-4 bg-white border-b border-warm-gray-100">
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder={t.tags?.newTagName || "New tag name..."}
                            className="bg-warm-gray-50 px-4 py-3 rounded-xl text-warm-gray-700 text-base"
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {loading ? (
                        <View className="p-8 items-center">
                            <ActivityIndicator size="small" color="#eb6e3e" />
                        </View>
                    ) : (
                        <ScrollView className="flex-1 px-4 py-2" keyboardShouldPersistTaps="handled">
                            {/* Create new tag button */}
                            {showCreateButton && (
                                <TouchableOpacity
                                    onPress={handleCreateTag}
                                    disabled={creating}
                                    className="flex-row items-center py-4 border-b border-warm-gray-100"
                                >
                                    {creating ? (
                                        <ActivityIndicator size="small" color="#eb6e3e" className="mr-3" />
                                    ) : (
                                        <View className="w-6 h-6 rounded bg-peach-100 items-center justify-center mr-3">
                                            <Plus color="#eb6e3e" size={16} />
                                        </View>
                                    )}
                                    <Text className="text-peach-700 font-medium text-base">
                                        {t.common.add} "{searchText.trim()}"
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* No tags state */}
                            {!loading && allTags.length === 0 && !searchText && (
                                <View className="py-8 items-center">
                                    <TagIcon color="#dfd8d3" size={48} className="mb-3" />
                                    <Text className="text-warm-gray-500 text-center px-8">
                                        {t.tags?.noTags || "No tags yet. Create your first tag above."}
                                    </Text>
                                </View>
                            )}

                            {/* Tag List */}
                            {filteredTags.map(tag => {
                                const isSelected = value.some(t => t.id === tag.id);
                                return (
                                    <TouchableOpacity
                                        key={tag.id}
                                        onPress={() => handleSelectTag(tag)}
                                        className="flex-row items-center justify-between py-4 border-b border-warm-gray-100"
                                    >
                                        <Text className={`text-base ${isSelected ? 'text-peach-700 font-semibold' : 'text-warm-gray-700'}`}>
                                            {tag.name}
                                        </Text>
                                        {isSelected && <Check color="#eb6e3e" size={20} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

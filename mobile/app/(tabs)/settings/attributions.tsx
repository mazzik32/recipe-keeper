import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ChevronLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeContext";

// Import the generated JSON file
import licensesData from "../../../assets/licenses.json";

type LicenseEntry = {
    id: string;
    name: string;
    version: string;
    description: string;
    repository: string;
    publisher: string;
    licenses: string;
    licenseText: string;
};

export default function AttributionsScreen() {
    const { t } = useLanguage();
    const router = useRouter();
    const { colors } = useTheme();

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const renderItem = ({ item }: { item: LicenseEntry }) => {
        const isExpanded = expandedId === item.id;

        return (
            <View className="bg-white dark:bg-dark-card dark:bg-dark-card rounded-2xl p-4 mb-4 border border-warm-gray-100 dark:border-dark-border dark:border-dark-border shadow-sm">
                <TouchableOpacity
                    onPress={() => toggleExpand(item.id)}
                    className="flex-row items-center justify-between active:opacity-70"
                >
                    <View className="flex-1 pr-4">
                        <Text className="font-bold text-warm-gray-800 dark:text-dark-text dark:text-dark-text text-lg mb-1" numberOfLines={isExpanded ? undefined : 1}>
                            {item.name} <Text className="text-warm-gray-400 dark:text-dark-muted font-normal text-sm">v{item.version}</Text>
                        </Text>
                        <View className="flex-row items-center flex-wrap gap-2 mt-1">
                            <View className="bg-warm-gray-50 dark:bg-dark-elevated dark:bg-dark-elevated px-2 py-1 rounded">
                                <Text className="text-warm-gray-600 dark:text-dark-muted dark:text-dark-muted text-xs font-medium">{item.licenses}</Text>
                            </View>
                            {item.publisher ? (
                                <Text className="text-warm-gray-400 dark:text-dark-muted text-xs">by {item.publisher}</Text>
                            ) : null}
                        </View>
                    </View>
                    <View className="p-2 border border-warm-gray-100 dark:border-dark-border rounded-full">
                        {isExpanded ? (
                            <ChevronUp color={colors.muted} size={18} />
                        ) : (
                            <ChevronDown color={colors.muted} size={18} />
                        )}
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View className="mt-4 pt-4 border-t border-warm-gray-100 dark:border-dark-border">
                        {item.description ? (
                            <Text className="text-warm-gray-500 dark:text-dark-muted text-sm mb-4">
                                {item.description}
                            </Text>
                        ) : null}

                        {item.repository ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(item.repository)}
                                className="flex-row items-center mb-4 active:opacity-70"
                            >
                                <ExternalLink color="#eb6e3e" size={14} className="mr-1.5" />
                                <Text className="text-peach-600 text-sm font-medium">View Repository</Text>
                            </TouchableOpacity>
                        ) : null}

                        <View className="bg-warm-gray-50 dark:bg-dark-bg p-3 rounded-lg mt-2">
                            <Text className="text-warm-gray-500 dark:text-dark-muted text-[10px] font-mono leading-tight">
                                {item.licenseText.trim() === '' ? 'License text not provided.' : item.licenseText}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-warm-gray-100 dark:border-dark-border dark:border-dark-border bg-white dark:bg-dark-card dark:bg-dark-card mt-2">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-800 dark:text-dark-text dark:text-dark-text font-bold text-center flex-1">
                    Open Source
                </Text>
                <View className="w-10" />
            </View>

            <FlatList
                data={licensesData as LicenseEntry[]}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                ListHeaderComponent={
                    <Text className="text-warm-gray-600 dark:text-dark-muted dark:text-dark-muted text-base mb-6">
                        RecipeKeeper uses the following open source software. We are grateful to the developers for their contributions.
                    </Text>
                }
                initialNumToRender={15}
                maxToRenderPerBatch={20}
                windowSize={5}
            />
        </SafeAreaView>
    );
}

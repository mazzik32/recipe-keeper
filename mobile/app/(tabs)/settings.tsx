import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCredits } from "../../contexts/CreditsContext";
import { supabase } from "../../lib/supabase";
import { LogOut, User as UserIcon, CreditCard, ChevronRight, Plus, Globe, Bell, Moon, Tag as TagIcon, Download, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

export default function SettingsScreen() {
    const { user, signOut, refreshSession } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const { credits } = useCredits();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Mock states for UI
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [offlineStorageEnabled, setOfflineStorageEnabled] = useState(false);

    const { locale, setLanguage } = useLanguage();

    useFocusEffect(
        () => {
            refreshSession();
        }
    );

    const toggleLanguage = () => {
        setLanguage(locale === 'en' ? 'de' : 'en');
    };

    useEffect(() => {
        async function loadProfile() {
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data);
            setLoading(false);

            const offlineSettings = await AsyncStorage.getItem('settings_offline_storage');
            setOfflineStorageEnabled(offlineSettings === 'true');
        }
        loadProfile();
    }, [user]);

    const handleOfflineToggle = async (value: boolean) => {
        setOfflineStorageEnabled(value);
        await AsyncStorage.setItem('settings_offline_storage', value.toString());
    };

    const handleClearDownloads = () => {
        Alert.alert(
            t.settings?.confirmRemoveDownloadsTitle || "Remove Downloads",
            t.settings?.confirmRemoveDownloadsDesc || "Are you sure you want to remove all offline recipe data? (Your recipes remain safely in the cloud).",
            [
                { text: t.common?.cancel || "Cancel", style: "cancel" },
                {
                    text: t.settings?.removeDownloads || "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const keys = await AsyncStorage.getAllKeys();
                        const detailKeys = keys.filter(k => k.startsWith('recipe_detail_'));
                        await AsyncStorage.multiRemove(detailKeys);
                        Alert.alert(t.common?.success || "Success", t.settings?.downloadsRemoved || "Downloads removed");
                    }
                }
            ]
        );
    };

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await signOut();
                        if (error) Alert.alert("Error Signing Out", error.message);
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            t.settings?.deleteAccountConfirmTitle || "Delete Account",
            t.settings?.deleteAccountConfirmDesc || "Are you sure you want to delete your account? This action is irreversible.",
            [
                { text: t.common?.cancel || "Cancel", style: "cancel" },
                {
                    text: t.settings?.deleteAccount || "Delete Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);

                            // Get the current session to pass token to API
                            const { data: { session } } = await supabase.auth.getSession();

                            if (!session?.access_token) {
                                throw new Error("No active session found");
                            }

                            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://www.recipekeeper.org'}/api/user/delete`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${session.access_token}`,
                                }
                            });

                            const data = await response.json();

                            if (!response.ok || !data.success) {
                                throw new Error(data.error || "Failed to delete account");
                            }

                            // Sign out locally
                            await signOut();

                        } catch (error: any) {
                            Alert.alert(t.common?.error || "Error", error.message || "Failed to delete account");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream">
            <View className="px-4 py-4 border-b border-warm-gray-100 bg-white">
                <Text className="font-playfair text-3xl text-warm-gray-700">{t.nav.settings}</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View className="bg-white p-6 mt-6 mx-4 rounded-2xl border border-warm-gray-100 shadow-sm flex-row items-center">
                    <View className="w-16 h-16 bg-peach-100 rounded-full items-center justify-center mr-4">
                        <UserIcon color="#eb6e3e" size={32} />
                    </View>
                    <View className="flex-1 justify-center">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="font-playfair text-xl text-warm-gray-700" numberOfLines={1}>
                                {profile?.display_name || profile?.full_name || "Chef"}
                            </Text>
                            {user?.is_anonymous && user?.new_email && (
                                <View className="bg-peach-100 px-2 py-0.5 rounded mb-1 max-w-[150px]">
                                    <Text className="text-peach-700 text-[10px] font-medium uppercase tracking-wider" numberOfLines={1}>{t.auth.pendingVerification}</Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-warm-gray-500 text-sm" numberOfLines={1}>
                            {user?.email || user?.new_email || (user?.is_anonymous ? "Anonymous User" : "")}
                        </Text>
                    </View>
                </View>

                {/* Account Details */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">{t.nav.account}</Text>

                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        <View className="flex-row items-center justify-between p-4 border-b border-warm-gray-50">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <CreditCard color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.nav.credits}</Text>
                            </View>
                            <Text className="text-peach-600 font-bold text-lg">{credits}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/settings/buy-credits')}
                            className="flex-row items-center justify-between p-4 bg-white active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                                    <Plus color="#22c55e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.iap.buyCredits}</Text>
                            </View>
                            <ChevronRight color="#d4d4d8" size={20} />
                        </TouchableOpacity>

                        {user?.is_anonymous && !user?.new_email && (
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/signup')}
                                className="flex-row items-center justify-between p-4 border-t border-warm-gray-50 bg-white active:opacity-70"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                        <UserIcon color="#eb6e3e" size={18} />
                                    </View>
                                    <Text className="text-warm-gray-700 font-medium text-base">{t.auth.signup || "Create Account"}</Text>
                                </View>
                                <ChevronRight color="#d4d4d8" size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Content & Organization */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">Content</Text>

                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/settings/collections')}
                            className="flex-row items-center justify-between p-4 bg-white border-b border-warm-gray-50 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <Globe color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{(t as any).collections?.manageCollections || "Manage Collections"}</Text>
                            </View>
                            <ChevronRight color="#d4d4d8" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/settings/tags')}
                            className="flex-row items-center justify-between p-4 bg-white active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <TagIcon color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.tags?.manageTags || "Manage Tags"}</Text>
                            </View>
                            <ChevronRight color="#d4d4d8" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preferences Elements */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">{t.nav.preferences}</Text>

                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        {/* Language */}
                        <View className="flex-row items-center justify-between p-4 border-b border-warm-gray-50 bg-white">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <Globe color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.nav.appLanguage}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={toggleLanguage}
                                className="bg-peach-100 px-4 py-2 rounded-full"
                            >
                                <Text className="text-peach-700 font-semibold">{locale === 'en' ? 'English' : 'Deutsch'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notifications */}
                        <View className="flex-row items-center justify-between p-4 border-b border-warm-gray-50 bg-white">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <Bell color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.nav.pushNotifications}</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: "#dfd8d3", true: "#eb6e3e" }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        {/* Appearance */}
                        <View className="flex-row items-center justify-between p-4 bg-white">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <Moon color="#eb6e3e" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.nav.darkMode}</Text>
                            </View>
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={setDarkModeEnabled}
                                trackColor={{ false: "#dfd8d3", true: "#eb6e3e" }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>
                </View>

                {/* Offline Storage */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">{t.settings?.offlineStorage || "Offline Storage"}</Text>

                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">

                        <View className="flex-row items-center justify-between p-4 border-b border-warm-gray-50 bg-white">
                            <View className="flex-1 flex-row items-center gap-3 mr-4">
                                <View className="w-8 h-8 rounded-full bg-peach-50 items-center justify-center">
                                    <Download color="#eb6e3e" size={18} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-warm-gray-700 font-medium text-base mb-0.5">{t.settings?.offlineStorage || "Offline Storage"}</Text>
                                    <Text className="text-warm-gray-400 text-xs" numberOfLines={2}>{t.settings?.offlineStorageDesc || "Download all recipes for offline viewing"}</Text>
                                </View>
                            </View>
                            <Switch
                                value={offlineStorageEnabled}
                                onValueChange={handleOfflineToggle}
                                trackColor={{ false: "#dfd8d3", true: "#eb6e3e" }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleClearDownloads}
                            className="flex-row items-center justify-between p-4 bg-white active:opacity-70"
                        >
                            <View className="flex-1 flex-row items-center gap-3 mr-4">
                                <View className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                    <Trash2 color="#ef4444" size={18} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-red-500 font-medium text-base mb-0.5">{t.settings?.removeDownloads || "Remove Downloads"}</Text>
                                    <Text className="text-red-400 text-xs" numberOfLines={2}>{t.settings?.removeDownloadsDesc || "Clear all offline cached recipe details"}</Text>
                                </View>
                            </View>
                            <ChevronRight color="#fca5a5" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Legal & Help */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">{t.nav.supportLegal}</Text>
                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://www.recipekeeper.org/privacy')}
                            className="flex-row items-center justify-between p-4 border-b border-warm-gray-50 active:opacity-70"
                        >
                            <Text className="text-warm-gray-700 font-medium text-base ml-11">{t.nav.privacyPolicy}</Text>
                            <ChevronRight color="#d4d4d8" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://www.recipekeeper.org/terms')}
                            className="flex-row items-center justify-between p-4 active:opacity-70"
                        >
                            <Text className="text-warm-gray-700 font-medium text-base ml-11">{t.nav.termsOfService}</Text>
                            <ChevronRight color="#d4d4d8" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Actions */}
                <View className="mt-12 px-4 pb-10">
                    {user?.is_anonymous && !user?.new_email ? (
                        <>
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/signup')}
                                className="bg-peach-500 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:bg-peach-600 mb-4"
                            >
                                <UserIcon color="#ffffff" size={20} className="mr-2" />
                                <Text className="text-white font-semibold text-lg">{t.auth.signup || "Create Account"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/login')}
                                className="bg-white border border-warm-gray-200 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:bg-warm-gray-50 mb-4"
                            >
                                <LogOut color="#737373" size={20} className="mr-2" />
                                <Text className="text-warm-gray-500 font-semibold text-lg">{t.auth.login || "Log In"}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={handleSignOut}
                                className="bg-white border border-warm-gray-200 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:bg-warm-gray-50 mb-4"
                            >
                                <LogOut color="#737373" size={20} className="mr-2" />
                                <Text className="text-warm-gray-500 font-semibold text-lg">{t.nav.signOut}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDeleteAccount}
                                className="bg-white border border-red-200 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:bg-red-50"
                            >
                                <Trash2 color="#ef4444" size={20} className="mr-2" />
                                <Text className="text-red-500 font-semibold text-lg">{t.settings?.deleteAccount || "Delete Account"}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <Text className="text-center mt-6 text-warm-gray-400 text-xs">RecipeKeeper v1.0.0</Text>
                </View>
            </ScrollView>
            <StatusBar style="auto" />
        </SafeAreaView >
    );
}

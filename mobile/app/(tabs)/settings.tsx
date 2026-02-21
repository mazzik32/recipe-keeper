import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import { LogOut, User as UserIcon, Settings as SettingsIcon, CreditCard, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        }
        loadProfile();
    }, [user]);

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
                        <Text className="font-playfair text-xl text-warm-gray-700 mb-1" numberOfLines={1}>
                            {profile?.full_name || "Chef"}
                        </Text>
                        <Text className="text-warm-gray-500 text-sm" numberOfLines={1}>
                            {user?.email}
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
                            {loading ? (
                                <ActivityIndicator size="small" color="#eb6e3e" />
                            ) : (
                                <Text className="text-peach-600 font-bold text-lg">{profile?.credits || 0}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/settings/preferences')}
                            className="flex-row items-center justify-between p-4 bg-white active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-warm-gray-100 items-center justify-center">
                                    <SettingsIcon color="#75716d" size={18} />
                                </View>
                                <Text className="text-warm-gray-700 font-medium text-base">{t.nav.preferences}</Text>
                            </View>
                            <ChevronRight color="#d4d4d8" size={20} />
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

                {/* Sign Out */}
                <View className="mt-12 px-4 pb-10">
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-white border border-red-200 rounded-2xl p-4 flex-row items-center justify-center shadow-sm active:bg-red-50"
                    >
                        <LogOut color="#ef4444" size={20} className="mr-2" />
                        <Text className="text-red-500 font-semibold text-lg">{t.nav.signOut}</Text>
                    </TouchableOpacity>

                    <Text className="text-center mt-6 text-warm-gray-400 text-xs">RecipeKeeper v1.0.0</Text>
                </View>

            </ScrollView>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

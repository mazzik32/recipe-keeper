import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Globe, Moon } from "lucide-react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function PreferencesScreen() {
    const router = useRouter();
    const { locale, setLanguage, t } = useLanguage();

    // Mock states for UI
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    const toggleLanguage = () => {
        setLanguage(locale === 'en' ? 'de' : 'en');
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream">
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-warm-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft color="#75716d" size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-xl text-warm-gray-700">{t.nav.preferences}</Text>
            </View>

            <ScrollView className="flex-1 px-4 py-6">

                {/* Language Settings */}
                <View className="mb-8">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider">Language</Text>
                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        <View className="flex-row items-center justify-between p-4 bg-white">
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
                    </View>
                </View>

                {/* Notification Settings */}
                <View className="mb-8">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider">Notifications</Text>
                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
                        <View className="flex-row items-center justify-between p-4 bg-white">
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
                    </View>
                </View>

                {/* Appearance Settings */}
                <View className="mb-8">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider">Appearance</Text>
                    <View className="bg-white rounded-2xl border border-warm-gray-100 overflow-hidden shadow-sm">
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

            </ScrollView>
        </SafeAreaView>
    );
}

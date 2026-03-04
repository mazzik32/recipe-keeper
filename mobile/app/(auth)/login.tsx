import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert(t.common.error, error.message);
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg px-6">
            <View className="mt-2 mb-2 z-10">
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    className="p-2 -ml-2"
                >
                    <ChevronLeft size={32} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View className="flex-1 justify-center pb-20">
                <View className="mb-8">
                    <Text className="font-playfair text-4xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center mb-2">{t.common.appName}</Text>
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center">{t.auth.login}</Text>
                </View>

                <View className="space-y-4">
                    {user?.is_anonymous && (
                        <View className="bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 border border-red-100 p-3 rounded-xl mb-2">
                            <Text className="text-red-600 text-sm font-medium">{t.auth.loginWarning}</Text>
                        </View>
                    )}

                    <TextInput
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text"
                        placeholder="Email address"
                        placeholderTextColor={colors.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text mt-4"
                        placeholder="Password"
                        placeholderTextColor={colors.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <View className="items-end mt-2 mb-2">
                        <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                            <Text className="text-peach-600 font-medium text-sm">Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className={`bg-peach-500 rounded-full h-12 items-center justify-center mt-2 ${loading ? 'opacity-50' : ''}`}
                        onPress={signInWithEmail}
                        disabled={loading}
                    >
                        <Text className="text-white font-semibold text-lg">
                            {loading ? t.common.loading : t.auth.login}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-sm mr-1">Don't have an account?</Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                            <Text className="text-peach-600 font-bold text-sm">{t.auth.signup}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

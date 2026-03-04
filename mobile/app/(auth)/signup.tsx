import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function SignupScreen() {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const { locale, t } = useLanguage();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();

    async function handleSignup() {
        if (!displayName || !email || !password) {
            Alert.alert(t.common.error, locale === "de" ? "Bitte fülle alle Felder aus" : "Please fill in all fields");
            return;
        }

        setLoading(true);

        let error;

        // If the user is currently anonymous, we upgrade their account
        // to preserve their 5 free scans and any recipes they saved.
        if (user?.is_anonymous) {
            const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                email,
                password,
                data: { display_name: displayName }
            });
            error = updateError;

            // Note: updateUser might send a confirmation email depending on Supabase settings.
            if (!updateError) {
                // The handle_new_user Postgres trigger only fires on INSERT, not UPDATE.
                // We must manually update their profile to ensure the new display_name renders on Settings.
                await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);

                // If Supabase has email confirmations enabled, they will have `new_email` set.
                if (updateData?.user?.new_email) {
                    setIsSuccess(true);
                } else {
                    router.replace("/(tabs)");
                }
                setLoading(false);
                return;
            }
        } else {
            // Otherwise, normal signup
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    },
                },
            });
            error = signUpError;
        }

        if (error) {
            Alert.alert(t.common.error, error.message);
        } else {
            setIsSuccess(true);
        }
        setLoading(false);
    }

    if (isSuccess) {
        return (
            <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg px-6 justify-center">
                <View className="bg-white dark:bg-dark-card dark:bg-dark-card p-6 rounded-3xl border border-warm-gray-200 dark:border-dark-border dark:border-dark-border shadow-sm items-center">
                    <Text className="font-playfair text-3xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center mb-4">
                        {t.auth.checkEmail}
                    </Text>
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center mb-8">
                        {t.auth.checkEmailDesc}
                    </Text>

                    <TouchableOpacity
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-peach-200 rounded-full h-12 w-full flex-row items-center justify-center mb-2 active:bg-peach-50 dark:bg-dark-peach-subtle dark:bg-dark-peach-subtle"
                        onPress={() => user?.is_anonymous ? router.replace("/(tabs)") : router.replace("/(auth)/login")}
                    >
                        <Text className="text-peach-600 font-semibold text-base">
                            {user?.is_anonymous ? t.auth.continueApp : t.auth.backToLogin}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
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
                <View className="mb-8 mt-4">
                    <Text className="font-playfair text-4xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center mb-2">
                        {t.auth.signup}
                    </Text>
                    <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center">
                        {t.auth.createAccountDesc}
                    </Text>
                </View>

                <View className="space-y-4">
                    <TextInput
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text"
                        placeholder={t.auth.displayNamePlaceholder}
                        placeholderTextColor={colors.muted}
                        value={displayName}
                        onChangeText={setDisplayName}
                    />
                    <TextInput
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text mt-4"
                        placeholder={t.auth.login.includes("Sign") ? "Email address" : "E-Mail-Adresse"}
                        placeholderTextColor={colors.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text mt-4"
                        placeholder={t.auth.login.includes("Sign") ? "Password" : "Passwort"}
                        placeholderTextColor={colors.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        className={`bg-peach-500 rounded-full h-12 items-center justify-center mt-8 ${loading ? 'opacity-50' : ''}`}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        <Text className="text-white font-semibold text-lg">
                            {loading ? t.common.loading : t.auth.signup}
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-sm mr-1">
                            {t.auth.alreadyHaveAccount}
                        </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <Text className="text-peach-600 font-bold text-sm">{t.auth.login}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

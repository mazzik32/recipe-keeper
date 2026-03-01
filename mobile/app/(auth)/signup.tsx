import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupScreen() {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const { locale, t } = useLanguage();
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
            const { error: updateError } = await supabase.auth.updateUser({
                email,
                password,
                data: { display_name: displayName }
            });
            error = updateError;

            // Note: updateUser might send a confirmation email depending on Supabase settings.
            // If it succeeds without an email requirement, the session is already active.
            if (!updateError) {
                router.replace("/(tabs)");
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
            <SafeAreaView className="flex-1 bg-cream px-6 justify-center">
                <View className="bg-white p-6 rounded-3xl border border-warm-gray-200 shadow-sm items-center">
                    <Text className="font-playfair text-3xl text-warm-gray-700 text-center mb-4">
                        {locale === "de" ? "E-Mail bestätigen" : "Check your email"}
                    </Text>
                    <Text className="text-warm-gray-500 text-center mb-8">
                        {locale === "de"
                            ? "Wir haben dir einen Bestätigungslink gesendet. Bitte überprüfe deinen Posteingang (und Spam-Ordner) und klicke auf den Link, um dein Konto zu aktivieren."
                            : "We have sent you a confirmation link. Please check your inbox (and spam folder) and click the link to activate your account."}
                    </Text>

                    <TouchableOpacity
                        className="bg-white border border-peach-200 rounded-full h-12 w-full flex-row items-center justify-center mb-2 active:bg-peach-50"
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        <Text className="text-peach-600 font-semibold text-base">
                            {locale === "de" ? "Zurück zum Login" : "Back to Login"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-cream px-6 justify-center">
            <View className="mb-8 mt-4">
                <Text className="font-playfair text-4xl text-warm-gray-700 text-center mb-2">
                    {locale === "de" ? "Konto erstellen" : "Create Account"}
                </Text>
                <Text className="text-warm-gray-500 text-center">
                    {locale === "de"
                        ? "Beginne noch heute, deine Familienrezepte zu bewahren"
                        : "Start preserving your family recipes today"}
                </Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="bg-white border border-warm-gray-200 rounded-xl px-4 py-3 h-12 text-warm-gray-700"
                    placeholder={locale === "de" ? "Anzeigename (z.B. Anna)" : "Display Name (e.g. Anna)"}
                    placeholderTextColor="#b8b5b2"
                    value={displayName}
                    onChangeText={setDisplayName}
                />
                <TextInput
                    className="bg-white border border-warm-gray-200 rounded-xl px-4 py-3 h-12 text-warm-gray-700 mt-4"
                    placeholder={t.auth.login.includes("Sign") ? "Email address" : "E-Mail-Adresse"}
                    placeholderTextColor="#b8b5b2"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    className="bg-white border border-warm-gray-200 rounded-xl px-4 py-3 h-12 text-warm-gray-700 mt-4"
                    placeholder={t.auth.login.includes("Sign") ? "Password" : "Passwort"}
                    placeholderTextColor="#b8b5b2"
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
                        {loading
                            ? t.common.loading
                            : (locale === "de" ? "Konto erstellen" : "Create account")}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-warm-gray-500 text-sm mr-1">
                        {locale === "de" ? "Hast du schon ein Konto?" : "Already have an account?"}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-peach-600 font-bold text-sm">{t.auth.login}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../contexts/ThemeContext";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { colors, isDark } = useTheme();

    async function handleResetPassword() {
        if (!email.trim()) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "https://recipe-keeper.example.com/reset-password", // Web app handles actual reset
        });

        setLoading(false);

        if (error) {
            Alert.alert("Reset Failed", error.message);
        } else {
            Alert.alert(
                "Check Your Email",
                "A password reset link has been sent to your email address.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg dark:bg-dark-bg px-6">
            <TouchableOpacity
                className="mt-4 mb-8 flex-row items-center"
                onPress={() => router.back()}
            >
                <ArrowLeft color={colors.text} size={24} />
                <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted ml-2 font-medium">Back to Login</Text>
            </TouchableOpacity>

            <View className="mb-8">
                <Text className="font-playfair text-4xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text text-center mb-2">Reset Password</Text>
                <Text className="text-warm-gray-500 dark:text-dark-muted dark:text-dark-muted text-center px-4">
                    Enter your email address and we'll send you a link to reset your password.
                </Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="bg-white dark:bg-dark-card dark:bg-dark-card border border-warm-gray-200 dark:border-dark-border dark:border-dark-border rounded-xl px-4 py-3 h-12 text-warm-gray-700 dark:text-dark-text dark:text-dark-text mb-6"
                    placeholder="Email address"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TouchableOpacity
                    className={`bg-peach-500 rounded-full h-12 items-center justify-center ${loading ? 'opacity-50' : ''}`}
                    onPress={handleResetPassword}
                    disabled={loading || !email.trim()}
                >
                    <Text className="text-white font-semibold text-lg">
                        {loading ? "Sending link..." : "Send Reset Link"}
                    </Text>
                </TouchableOpacity>
            </View>
            <StatusBar style={isDark ? "light" : "dark"} />
        </SafeAreaView>
    );
}

import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert("Login Failed", error.message);
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-cream px-6 justify-center">
            <View className="mb-8">
                <Text className="font-playfair text-4xl text-warm-gray-700 text-center mb-2">RecipeKeeper</Text>
                <Text className="text-warm-gray-500 text-center">Sign in to your account</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="bg-white border border-warm-gray-200 rounded-xl px-4 py-3 h-12 text-warm-gray-700"
                    placeholder="Email address"
                    placeholderTextColor="#b8b5b2"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    className="bg-white border border-warm-gray-200 rounded-xl px-4 py-3 h-12 text-warm-gray-700 mt-4"
                    placeholder="Password"
                    placeholderTextColor="#b8b5b2"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    className={`bg-peach-500 rounded-full h-12 items-center justify-center mt-6 ${loading ? 'opacity-50' : ''}`}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    <Text className="text-white font-semibold text-lg">
                        {loading ? "Signing in..." : "Sign In"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

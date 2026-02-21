import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import "../global.css";

function RootLayoutNav() {
    const { session, initialized } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [session, initialized, segments]);

    return (
        <LanguageProvider>
            <Slot />
        </LanguageProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

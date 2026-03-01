import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { CreditsProvider } from "../contexts/CreditsContext";
import { useFonts, DancingScript_400Regular, DancingScript_500Medium, DancingScript_600SemiBold, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../global.css";

try {
    SplashScreen.preventAutoHideAsync();
} catch (e) {
    console.warn("Error preventing splash screen auto-hide:", e);
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
    const { session, user, initialized } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!initialized || !fontsLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup && !user?.is_anonymous) {
            router.replace('/(tabs)');
        }

        // Hide splash screen only when everything is ready
        SplashScreen.hideAsync().catch((e) => {
            // Splash screen already hidden
        });
    }, [session, initialized, segments, fontsLoaded]);

    return (
        <LanguageProvider>
            <CreditsProvider>
                <Slot />
            </CreditsProvider>
        </LanguageProvider>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        DancingScript_400Regular,
        DancingScript_500Medium,
        DancingScript_600SemiBold,
        DancingScript_700Bold,
        Inter: Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        'Playfair Display': PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        PlayfairDisplay_700Bold
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootLayoutNav fontsLoaded={fontsLoaded} />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

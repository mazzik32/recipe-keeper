import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

export type ThemeColors = {
    background: string;
    card: string;
    elevated: string;
    text: string;
    muted: string;
    border: string;
    peachSubtle: string;
    tabBar: string;
};

export const lightColors: ThemeColors = {
    background: '#FDF8F3', // cream
    card: '#FFFFFF', // white
    elevated: '#F5F4F3', // warm-gray-100
    text: '#3D3632', // warm-gray-700
    muted: '#999591', // warm-gray-500
    border: '#F5F4F3', // warm-gray-100
    peachSubtle: '#f9e9e1', // peach-100
    tabBar: '#FBFAF9', // warm-white
};

export const darkColors: ThemeColors = {
    background: '#1A1614',
    card: '#262220',
    elevated: '#302C2A',
    text: '#EDE8E3',
    muted: '#9A9490',
    border: '#3A3533',
    peachSubtle: '#2D201A',
    tabBar: '#1E1B19',
};

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: (value?: boolean) => void;
    colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => { },
    colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useRNColorScheme();
    const { setColorScheme } = useNativeWindColorScheme();
    const [isDark, setIsDark] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        async function loadTheme() {
            try {
                const stored = await AsyncStorage.getItem('theme_preference');
                if (stored !== null) {
                    const isDarkMode = stored === 'dark';
                    setIsDark(isDarkMode);
                    setColorScheme(isDarkMode ? 'dark' : 'light');
                } else {
                    // Default to system preference if none stored
                    const isSystemDark = systemColorScheme === 'dark';
                    setIsDark(isSystemDark);
                    setColorScheme(isSystemDark ? 'dark' : 'light');
                }
            } catch (e) {
                console.warn('Failed to load theme preference', e);
            } finally {
                setIsInitialized(true);
            }
        }
        loadTheme();
    }, [systemColorScheme]);

    const toggleTheme = async (forceValue?: boolean) => {
        const newValue = forceValue !== undefined ? forceValue : !isDark;
        setIsDark(newValue);
        setColorScheme(newValue ? 'dark' : 'light');
        try {
            await AsyncStorage.setItem('theme_preference', newValue ? 'dark' : 'light');
        } catch (e) {
            console.warn('Failed to save theme preference', e);
        }
    };

    const colors = isDark ? darkColors : lightColors;

    if (!isInitialized) {
        return null; // or a tiny unstyled view/splash
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

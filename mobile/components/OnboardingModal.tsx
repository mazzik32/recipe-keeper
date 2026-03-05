import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera, Search, Gift, Download, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const { t } = useLanguage();
    const { initialized } = useAuth();


    useEffect(() => {
        if (initialized) {
            checkOnboarding();
        }
    }, [initialized]);

    const checkOnboarding = async () => {
        try {
            const hasSeen = await AsyncStorage.getItem('has_seen_onboarding');
            if (hasSeen !== 'true') {
                // Wait briefly for Splash Screen to fully unmount before opening native Modal ViewController
                setTimeout(() => setVisible(true), 500);
            }
        } catch (e) {
            console.error('Failed to check onboarding status', e);
        }
    };

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            try {
                await AsyncStorage.setItem('has_seen_onboarding', 'true');
                setVisible(false);
            } catch (e) {
                console.error('Failed to save onboarding status', e);
                setVisible(false);
            }
        }
    };

    const slides = [
        {
            icon: <Camera color="#eb6e3e" size={80} />,
            title: t.onboarding?.scan || "AI Recipe Scanner",
            description: t.onboarding?.scanDesc || "Snap a photo of any recipe, and our AI will extract the ingredients and instructions for you."
        },
        {
            icon: <Search color="#eb6e3e" size={80} />,
            title: t.onboarding?.organize || "Search & Organize",
            description: t.onboarding?.organizeDesc || "Easily find your recipes with powerful search, tags, and custom collections."
        },
        {
            icon: <Gift color="#eb6e3e" size={80} />,
            title: t.onboarding?.credits || "Scan Credits",
            description: t.onboarding?.creditsDesc || "You get 5 free scans to start! You can always buy more credits later if you need them."
        },
        {
            icon: <Download color="#eb6e3e" size={80} />,
            title: t.onboarding?.offline || "Offline Storage",
            description: t.onboarding?.offlineDesc || "Enable offline storage in Settings to access all your recipes even without an internet connection."
        }
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg" edges={['top', 'bottom']}>
                <View className="flex-1 px-6 pb-6 items-center justify-between">
                    <ScrollView
                        className="w-full flex-1"
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text className="font-playfair text-3xl text-warm-gray-700 dark:text-dark-text mb-2 text-center">
                            {t.onboarding?.welcome || "Welcome to Recipe Keeper"}
                        </Text>
                        <Text className="text-warm-gray-500 dark:text-dark-muted text-center mb-8">
                            {t.onboarding?.welcomeDesc || "Your personal digital cookbook. Let's get started!"}
                        </Text>

                        <View className="w-32 h-32 bg-peach-100 dark:bg-dark-peach-subtle rounded-full items-center justify-center shadow-sm mb-8">
                            {slides[step].icon}
                        </View>

                        <Text className="font-playfair text-2xl text-warm-gray-700 dark:text-dark-text mb-4 text-center">
                            {slides[step].title}
                        </Text>
                        <Text className="text-warm-gray-500 dark:text-dark-muted text-base text-center leading-relaxed px-4 mb-4">
                            {slides[step].description}
                        </Text>
                    </ScrollView>

                    <View className="w-full pt-4">
                        {/* Pagination Dots */}
                        <View className="flex-row justify-center gap-2 mb-6">
                            {slides.map((_, index) => (
                                <View
                                    key={index}
                                    className={`h-2 rounded-full ${index === step ? 'w-6 bg-peach-500' : 'w-2 bg-peach-200'}`}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleNext}
                            className="w-full bg-peach-500 py-4 rounded-2xl flex-row justify-center items-center shadow-sm active:opacity-80"
                        >
                            <Text className="text-white font-bold text-lg mr-2">
                                {step === 3 ? (t.onboarding?.getStarted || "Let's Start Cooking!") : (t.onboarding?.next || "Next")}
                            </Text>
                            {step < 3 && <ChevronRight color="#ffffff" size={20} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

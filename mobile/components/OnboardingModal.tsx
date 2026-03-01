import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera, Search, Gift, Download, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const hasSeen = await AsyncStorage.getItem('has_seen_onboarding');
            if (hasSeen !== 'true') {
                setVisible(true);
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
            <View className="flex-1 bg-cream" style={{ paddingTop: insets.top + 20 }}>
                <View className="flex-1 px-6 pb-6 items-center justify-between">
                    <View className="items-center w-full">
                        <Text className="font-playfair text-3xl text-warm-gray-700 mb-2 text-center">
                            {t.onboarding?.welcome || "Welcome to Recipe Keeper"}
                        </Text>
                        <Text className="text-warm-gray-500 text-center mb-12">
                            {t.onboarding?.welcomeDesc || "Your personal digital cookbook. Let's get started!"}
                        </Text>

                        <View className="w-40 h-40 bg-peach-100 rounded-full items-center justify-center shadow-sm mb-10">
                            {slides[step].icon}
                        </View>

                        <Text className="font-playfair text-2xl text-warm-gray-700 mb-4 text-center">
                            {slides[step].title}
                        </Text>
                        <Text className="text-warm-gray-500 text-base text-center leading-relaxed px-4">
                            {slides[step].description}
                        </Text>
                    </View>

                    <View className="w-full">
                        {/* Pagination Dots */}
                        <View className="flex-row justify-center gap-2 mb-8">
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
            </View>
        </Modal>
    );
}

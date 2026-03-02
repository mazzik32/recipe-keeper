import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useLoadingMessages } from '../hooks/useLoadingMessages';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface WhiskLoaderProps {
    isAnalyzing?: boolean;
    fullScreen?: boolean;
}

export default function WhiskLoader({ isAnalyzing = false, fullScreen = false }: WhiskLoaderProps) {
    const { t } = useLanguage();
    const loadingMessage = useLoadingMessages(3500);

    const content = (
        <View className="items-center justify-center">
            <LottieView
                source={require('../assets/recipekeeper.json')}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
            />
            {isAnalyzing ? (
                <Animated.Text
                    className="text-warm-gray-700 font-medium text-center px-6 mt-4 text-base"
                    key={loadingMessage} // Changing key triggers the animation for the new text
                    entering={FadeIn.duration(400)}
                    exiting={FadeOut.duration(400)}
                >
                    {loadingMessage}
                </Animated.Text>
            ) : (
                <Text className="text-warm-gray-700 font-medium mt-4">
                    {t.common.loading}
                </Text>
            )}
        </View>
    );

    if (fullScreen) {
        return (
            <View className="flex-1 bg-cream items-center justify-center absolute inset-0 z-50 rounded-2xl">
                {content}
            </View>
        );
    }

    return content;
}

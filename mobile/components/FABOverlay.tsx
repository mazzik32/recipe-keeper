import { useEffect, useRef, useState } from "react";
import {
    View,
    TouchableOpacity,
    BackHandler,
    StatusBar,
    useWindowDimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    useReducedMotion,
    Easing,
} from "react-native-reanimated";
import { Plus, X } from "lucide-react-native";
import AddRecipeScreen from "./AddRecipeScreen";

const FAB_SIZE = 56;

// peach-300 — matches the "All Recipes" selected tag pill
const FAB_COLOR = "#f8a888";
// Cream — the app's background colour, covers the expanding circle
const CONTENT_BG = "#fbfaf9";

export default function FABOverlay() {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const reduceMotion = useReducedMotion();

    const [isOpen, setIsOpen] = useState(false);
    const isAnimating = useRef(false);

    // Centre FAB in the tab bar — sits slightly above the icon row
    const fabBottom = insets.bottom + 16;
    const fabLeft = width / 2 - FAB_SIZE / 2;

    // Scale to fill full screen from the FAB centre
    const maxRadius = Math.hypot(width, height);
    const targetCircleScale = (maxRadius * 2) / FAB_SIZE;

    // ─── Animation values ─────────────────────────────────────────────
    const fabScale = useSharedValue(1);
    const circleScale = useSharedValue(1);
    const circleBorderRadius = useSharedValue(FAB_SIZE / 2);
    const contentOpacity = useSharedValue(0);

    const fabAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: fabScale.value }],
    }));
    const circleAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: circleScale.value }],
        borderRadius: circleBorderRadius.value,
    }));
    const contentAnimStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    // ─── Open ─────────────────────────────────────────────────────────
    const openOverlay = () => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        setIsOpen(true);

        if (reduceMotion) {
            circleScale.value = targetCircleScale;
            circleBorderRadius.value = 0;
            contentOpacity.value = withTiming(1, { duration: 200 });
            isAnimating.current = false;
        } else {
            // 1. FAB pop
            fabScale.value = withSequence(
                withSpring(1.18, { damping: 8, stiffness: 400 }),
                withSpring(1, { damping: 10, stiffness: 300 })
            );
            // 2. Circle fills screen
            circleScale.value = withTiming(targetCircleScale, { duration: 380 });
            circleBorderRadius.value = withTiming(0, { duration: 380 });
            // 3. Cream content fades in over the (now hidden) circle
            setTimeout(() => {
                contentOpacity.value = withTiming(1, { duration: 220 });
                isAnimating.current = false;
            }, 280);
        }
    };

    // ─── Close ────────────────────────────────────────────────────────
    const closeOverlay = () => {
        if (isAnimating.current) return;
        isAnimating.current = true;

        contentOpacity.value = withTiming(0, { duration: 150 });
        setTimeout(() => {
            // Clean ease-out — no spring bounce on close
            const easing = Easing.out(Easing.cubic);
            circleScale.value = withTiming(1, { duration: 300, easing });
            circleBorderRadius.value = withTiming(FAB_SIZE / 2, { duration: 300, easing });
            setTimeout(() => {
                setIsOpen(false);
                isAnimating.current = false;
            }, 310);
        }, 120);
    };

    // ─── Android back ─────────────────────────────────────────────────
    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            if (isOpen) { closeOverlay(); return true; }
            return false;
        });
        return () => sub.remove();
    }, [isOpen]);

    return (
        <>
            {/* Expanding circle — peach-300, anchored to FAB centre */}
            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        left: fabLeft,
                        bottom: fabBottom,
                        width: FAB_SIZE,
                        height: FAB_SIZE,
                        backgroundColor: FAB_COLOR,
                        zIndex: 90,
                    },
                    circleAnimStyle,
                ]}
            />

            {/* Content overlay — cream background fully covers the circle */}
            {isOpen && (
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 91,
                            backgroundColor: CONTENT_BG,
                        },
                        contentAnimStyle,
                    ]}
                >
                    <Pressable style={{ flex: 1 }}>
                        <StatusBar barStyle="dark-content" />
                        <SafeAreaView style={{ flex: 1 }}>
                            {/* Close */}
                            <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingTop: 8 }}>
                                <TouchableOpacity
                                    onPress={closeOverlay}
                                    style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: "rgba(0,0,0,0.08)",
                                        alignItems: "center", justifyContent: "center",
                                    }}
                                    accessibilityLabel="Close add recipe"
                                    accessibilityRole="button"
                                >
                                    <X color="#3d3632" size={20} />
                                </TouchableOpacity>
                            </View>
                            <KeyboardAvoidingView
                                style={{ flex: 1 }}
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                keyboardVerticalOffset={insets.top}
                            >
                                <AddRecipeScreen onDismiss={closeOverlay} />
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    </Pressable>
                </Animated.View>
            )}

            {/* FAB — hidden while overlay is open */}
            {!isOpen && (
                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            left: fabLeft,
                            bottom: fabBottom,
                            width: FAB_SIZE,
                            height: FAB_SIZE,
                            zIndex: 95,
                        },
                        fabAnimStyle,
                    ]}
                >
                    <TouchableOpacity
                        onPress={openOverlay}
                        accessibilityLabel="Add new recipe"
                        accessibilityRole="button"
                        style={{
                            width: FAB_SIZE,
                            height: FAB_SIZE,
                            borderRadius: FAB_SIZE / 2,
                            backgroundColor: FAB_COLOR,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#c87a5a",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.30,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                        // @ts-ignore - Android: prevents collapsible optimisation
                        collapsable={false}
                    >
                        <Plus color="#fff" size={26} strokeWidth={2.5} />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </>
    );
}

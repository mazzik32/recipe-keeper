import { useState, useRef, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Image as RNImage } from "react-native";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, RotateCw, Check } from "lucide-react-native";
import { useLanguage } from "../../contexts/LanguageContext";

interface ImageCropperModalProps {
    imageUri: string | null;
    visible: boolean;
    onClose: () => void;
    onConfirm: (croppedUri: string) => void;
    onSkip: () => void;
    initialAspectRatio?: number;
}

const { width: windowWidth } = Dimensions.get("window");
const cropWidth = windowWidth - 40;

export function ImageCropperModal({
    imageUri,
    visible,
    onClose,
    onConfirm,
    onSkip,
    initialAspectRatio = 16 / 9,
}: ImageCropperModalProps) {
    const { t } = useLanguage();
    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // original image dimensions
    const [imgWidth, setImgWidth] = useState(0);
    const [imgHeight, setImgHeight] = useState(0);

    useEffect(() => {
        if (imageUri && visible) {
            RNImage.getSize(imageUri, (w: number, h: number) => {
                setImgWidth(w);
                setImgHeight(h);
            }, (err: any) => {
                console.log("Failed to get image size", err);
            });
        }
    }, [imageUri, visible]);

    const handleConfirm = async () => {
        if (!imageUri || imgWidth === 0 || imgHeight === 0) return;
        setIsProcessing(true);
        try {
            const actions: ImageManipulator.Action[] = [];

            // 1. Rotate
            if (rotation !== 0) {
                actions.push({ rotate: rotation });
            }

            // For zoom, we do a center crop. This is simplified compared to full pan/zoom.
            // If zoom > 1, the visible portion is smaller.
            // After rotation, dimensions might change, but let's approximate by cropping the center.
            // A more advanced app would track exact pan values, but center crop + zoom + rotate is reasonable.

            // To be accurate, we should let Expo manipulate size after rotation is unknown.
            // Let's first apply rotation:
            let processUri = imageUri;
            if (actions.length > 0) {
                const res = await ImageManipulator.manipulateAsync(imageUri, actions, { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
                processUri = res.uri;
                // Get new dimensions
                await new Promise<void>((resolve) => {
                    RNImage.getSize(processUri, (w: number, h: number) => {
                        setImgWidth(w);
                        setImgHeight(h);
                        resolve();
                    });
                });
            }

            // Now apply center crop
            // The target box has aspect ratio `aspectRatio`.
            // We want to fit a box of this aspect ratio into the image bounds, scaled down by `zoom`.

            let cropBoxW = imgWidth;
            let cropBoxH = imgWidth / aspectRatio;

            if (cropBoxH > imgHeight) {
                cropBoxH = imgHeight;
                cropBoxW = imgHeight * aspectRatio;
            }

            // Apply zoom (zoom = 1 means fit max. zoom = 2 means take half the size in center)
            const actualCropW = cropBoxW / zoom;
            const actualCropH = cropBoxH / zoom;

            const originX = (imgWidth - actualCropW) / 2;
            const originY = (imgHeight - actualCropH) / 2;

            const cropAction: ImageManipulator.Action = {
                crop: {
                    originX: Math.max(0, Math.round(originX)),
                    originY: Math.max(0, Math.round(originY)),
                    width: Math.min(imgWidth, Math.round(actualCropW)),
                    height: Math.min(imgHeight, Math.round(actualCropH))
                }
            };

            const finalRes = await ImageManipulator.manipulateAsync(processUri, [cropAction], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });

            onConfirm(finalRes.uri);
        } catch (err) {
            console.error(err);
            Alert.alert(t.common.error, "Failed to crop image.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageUri) return null;

    const tabs = [
        { label: "16:9", value: 16 / 9 },
        { label: "4:3", value: 4 / 3 },
        { label: "1:1", value: 1 },
        { label: "3:4", value: 3 / 4 },
        { label: "9:16", value: 9 / 16 },
    ];

    const cropHeight = cropWidth / aspectRatio;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-white dark:bg-dark-card dark:bg-dark-card" edges={["top", "bottom"]}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-warm-gray-100 dark:border-dark-border dark:border-dark-border">
                    <TouchableOpacity onPress={onClose} className="p-2" disabled={isProcessing}>
                        <X color="#75716d" size={24} />
                    </TouchableOpacity>
                    <Text className="font-playfair text-xl text-warm-gray-700 dark:text-dark-text dark:text-dark-text">Edit Image</Text>
                    <TouchableOpacity onPress={handleConfirm} className="p-2" disabled={isProcessing}>
                        {isProcessing ? <ActivityIndicator size="small" color="#eb6e3e" /> : <Check color="#eb6e3e" size={24} />}
                    </TouchableOpacity>
                </View>

                {/* Preview Area */}
                <View className="flex-1 bg-black items-center justify-center overflow-hidden relative">
                    {/* The Image */}
                    <View
                        style={{
                            width: cropWidth,
                            height: cropHeight,
                            overflow: 'hidden',
                            borderColor: 'rgba(255,255,255,0.5)',
                            borderWidth: 2,
                        }}
                        className="items-center justify-center relative"
                    >
                        <Image
                            source={{ uri: imageUri }}
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: [
                                    { rotate: `${rotation}deg` },
                                    { scale: zoom },
                                ]
                            }}
                            contentFit="cover"
                        />
                    </View>
                </View>

                {/* Controls Area */}
                <View className="px-6 py-6 pb-12 bg-white dark:bg-dark-card dark:bg-dark-card space-y-6">
                    {/* Aspect Ratio Tabs */}
                    <View className="flex-row justify-center gap-2">
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.label}
                                onPress={() => setAspectRatio(tab.value)}
                                className={`px-3 py-1.5 rounded-full ${aspectRatio === tab.value ? 'bg-peach-500' : 'bg-warm-gray-100'}`}
                            >
                                <Text className={`text-sm font-medium ${aspectRatio === tab.value ? 'text-white' : 'text-warm-gray-600'}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Zoom Slider */}
                    <View className="flex-row items-center gap-4 mt-4">
                        <Text className="text-sm font-medium text-warm-gray-600 dark:text-dark-text dark:text-dark-text w-12">Zoom</Text>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={1}
                            maximumValue={3}
                            step={0.1}
                            value={zoom}
                            onValueChange={setZoom}
                            minimumTrackTintColor="#eb6e3e"
                            maximumTrackTintColor="#e5e5ea"
                            thumbTintColor="#eb6e3e"
                        />
                    </View>

                    {/* Rotate Slider */}
                    <View className="flex-row items-center gap-4">
                        <RotateCw color="#75716d" size={20} className="w-6" />
                        <Text className="text-sm font-medium text-warm-gray-600 dark:text-dark-text dark:text-dark-text w-10">Rotate</Text>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={0}
                            maximumValue={360}
                            step={1}
                            value={rotation}
                            onValueChange={setRotation}
                            minimumTrackTintColor="#eb6e3e"
                            maximumTrackTintColor="#e5e5ea"
                            thumbTintColor="#eb6e3e"
                        />
                    </View>

                    {/* Skip Button */}
                    <TouchableOpacity onPress={onSkip} className="mt-4 py-3 items-center border border-warm-gray-300 rounded-xl" disabled={isProcessing}>
                        <Text className="text-warm-gray-600 dark:text-dark-text dark:text-dark-text font-semibold">Skip (Use Original)</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

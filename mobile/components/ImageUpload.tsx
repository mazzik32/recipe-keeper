import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Upload, X, Camera } from "lucide-react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { ImageCropperModal } from "./shared/ImageCropperModal";
import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

interface ImageUploadProps {
    value?: string | null;
    onChange: (uri: string | null) => void;
    aspectRatio?: "video" | "square";
    className?: string;
    label?: string;
    size?: "medium" | "small";
}

export function ImageUpload({ value, onChange, aspectRatio = "video", className = "", label, size = "medium" }: ImageUploadProps) {
    const { t } = useLanguage();
    const [isPicking, setIsPicking] = useState(false);

    const [cropModalVisible, setCropModalVisible] = useState(false);
    const [rawImageUri, setRawImageUri] = useState<string | null>(null);

    const pickImage = async () => {
        setIsPicking(true);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Sorry, we need camera roll permissions to make this work!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // We use our own cropper
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setRawImageUri(result.assets[0].uri);
                setCropModalVisible(true);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert(t.common.error, "Failed to pick image");
        } finally {
            setIsPicking(false);
        }
    };

    const handleCropConfirm = (croppedUri: string) => {
        setCropModalVisible(false);
        onChange(croppedUri);
        setRawImageUri(null);
    };

    const handleCropSkip = () => {
        setCropModalVisible(false);
        if (rawImageUri) {
            onChange(rawImageUri);
        }
        setRawImageUri(null);
    };

    const handleCropClose = () => {
        setCropModalVisible(false);
        setRawImageUri(null);
    };

    const handleRemove = () => {
        onChange(null);
    };

    // Calculate aspect ratio styling
    const aspectClass = aspectRatio === "video" ? "aspect-video" : "aspect-square";

    return (
        <View className={`w-full ${className}`}>
            {label && <Text className="text-warm-gray-500 dark:text-dark-muted font-semibold mb-2 uppercase text-xs tracking-wider">{label}</Text>}
            <View className={`relative border-2 border-dashed border-warm-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-warm-gray-50 dark:bg-dark-elevated ${aspectClass} ${size === 'small' && !value ? 'h-24' : ''}`}>
                {value ? (
                    <>
                        <Image source={{ uri: value }} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="cover" />
                        <TouchableOpacity
                            onPress={handleRemove}
                            className={`absolute top-2 right-2 rounded-full bg-black/50 items-center justify-center ${size === 'small' ? 'w-6 h-6' : 'w-8 h-8'}`}
                        >
                            <X color="#fff" size={size === 'small' ? 12 : 16} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={isPicking}
                        className="flex-1 items-center justify-center p-2"
                    >
                        {isPicking ? (
                            <ActivityIndicator color="#eb6e3e" />
                        ) : (
                            <>
                                <Upload color="#a8a29e" size={size === 'small' ? 24 : 32} className={size === 'small' ? 'mb-1' : 'mb-2'} />
                                <Text className="text-warm-gray-500 dark:text-dark-muted text-xs font-medium">Upload photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Cropper Modal */}
            <ImageCropperModal
                imageUri={rawImageUri}
                visible={cropModalVisible}
                onClose={handleCropClose}
                onConfirm={handleCropConfirm}
                onSkip={handleCropSkip}
                initialAspectRatio={aspectRatio === "video" ? 16 / 9 : 1}
            />
        </View>
    );
}

// Utility function to upload local URIs to Supabase
export async function uploadImageToSupabase(localUri: string, bucket: string, folder: string, userId: string): Promise<string> {
    try {
        const fileExt = localUri.split('.').pop() || 'jpg';
        const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

        const contentType = fileExt.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, decode(base64), {
                contentType,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
}

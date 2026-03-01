import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, ScrollView } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { X, Plus, Camera, UploadCloud, Link as LinkIcon, PenLine, Trash2 } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCredits } from "../../contexts/CreditsContext";
import WhiskLoader from "../../components/WhiskLoader";
import CreditGateModal from "../../components/CreditGateModal";

const MAX_IMAGES = 5;

export default function AddRecipeScreen() {
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlValue, setUrlValue] = useState("");
    const [showCreditModal, setShowCreditModal] = useState(false);
    const { user } = useAuth();
    const { refreshCredits, credits } = useCredits();
    const router = useRouter();
    const { t, locale } = useLanguage();

    const takePhoto = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert(t.add.maxImages, t.add.maxReached);
            return;
        }

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow camera access to scan recipes.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(prev => [...prev, result.assets[0].uri]);
        }
    };

    const pickImage = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert(t.add.maxImages, t.add.maxReached);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            setImages(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllImages = () => {
        setImages([]);
    };

    const uploadRecipe = async () => {
        if (images.length === 0 || !user) return;
        setUploading(true);

        try {
            // 0. Consume credit first
            const { error: consumeError } = await supabase.rpc("consume_single_credit");
            if (consumeError) {
                if (consumeError.message?.includes("insufficient_credits") || consumeError.code === "P0001") {
                    throw new Error("Insufficient credits. Please purchase more to continue scanning.");
                }
                throw new Error("Failed to verify credits: " + (consumeError.message || "Unknown error"));
            }

            // Instantly update local credit context
            await refreshCredits();

            const { data: sessionData } = await supabase.auth.getSession();
            const uploadedUrls: string[] = [];

            // 1. Upload all images to Cloudflare R2
            for (const imageUri of images) {
                // Get Presigned URL from Next.js Backend
                const presignRes = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/storage/presign`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        filename: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`,
                        contentType: "image/jpeg",
                    }),
                });

                if (!presignRes.ok) {
                    throw new Error("Failed to get secure upload URL");
                }

                const { presignedUrl, publicUrl } = await presignRes.json();

                // Upload directly to Cloudflare R2
                const imgRes = await fetch(imageUri);
                const imageBlob = await imgRes.blob();

                const uploadRes = await fetch(presignedUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "image/jpeg",
                    },
                    body: imageBlob,
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image to Edge Storage");
                }

                uploadedUrls.push(publicUrl);
            }

            // 2. Call Supabase Edge Function to analyze with all images
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-recipe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        imageUrls: uploadedUrls,
                        targetLanguage: locale,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to analyze recipe with AI.");
            }

            const result = await response.json();

            // 3. Navigate to Review Screen
            const recipeToReview = {
                ...result.data,
                originalImageUrl: uploadedUrls[0],
                originalImageUrls: uploadedUrls,
            };

            setImages([]);
            setUploading(false);

            router.push({
                pathname: "/recipes/recipe-form",
                params: { mode: "create", recipe: JSON.stringify(recipeToReview) }
            });

        } catch (error: any) {
            setUploading(false);
            if (error.message?.includes("Insufficient credits")) {
                setShowCreditModal(true);
            } else {
                Alert.alert("Analysis Failed", error.message);
            }
        }
    };

    const scrapeRecipe = async () => {
        if (!urlValue || !user) return;
        setUploading(true);

        try {
            // 0. Consume credit first
            const { error: consumeError } = await supabase.rpc("consume_single_credit");
            if (consumeError) {
                if (consumeError.message?.includes("insufficient_credits") || consumeError.code === "P0001") {
                    throw new Error("Insufficient credits. Please purchase more to continue scanning.");
                }
                throw new Error("Failed to verify credits: " + (consumeError.message || "Unknown error"));
            }

            // Instantly update local credit context
            await refreshCredits();

            const { data: sessionData } = await supabase.auth.getSession();

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/scrape-recipe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        url: urlValue,
                        targetLanguage: locale,
                    }),
                }
            );

            if (!response.ok) {
                let msg = "Failed to scrape recipe from URL.";
                try {
                    const err = await response.json();
                    msg = err.error?.message || msg;
                } catch { }
                throw new Error(msg);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || "Failed to parse recipe.");
            }

            const recipeToReview = {
                ...result.data,
            };

            setUrlValue("");
            setShowUrlInput(false);
            setUploading(false);

            router.push({
                pathname: "/recipes/recipe-form",
                params: { mode: "create", recipe: JSON.stringify(recipeToReview) }
            });

        } catch (error: any) {
            setUploading(false);
            if (error.message?.includes("Insufficient credits")) {
                setShowCreditModal(true);
            } else {
                Alert.alert("Analysis Failed", error.message);
            }
        }
    };

    return (
        <View className="flex-1 bg-cream px-6 justify-center items-center relative">
            <CreditGateModal
                visible={showCreditModal}
                onClose={() => setShowCreditModal(false)}
            />

            {uploading && (
                <View className="absolute inset-0 z-50 bg-cream/95 flex-1 justify-center items-center" style={{ elevation: 10 }}>
                    <WhiskLoader isAnalyzing={true} />
                </View>
            )}
            <Text className="font-playfair text-3xl text-warm-gray-700 mb-8 text-center">{t.add.addRecipeTitle}</Text>

            {images.length > 0 ? (
                <View className="w-full items-center">
                    {/* Image counter */}
                    <Text className="text-warm-gray-500 font-medium mb-3">
                        {images.length}/{MAX_IMAGES} {t.add.images}
                    </Text>

                    {/* Thumbnail strip */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
                    >
                        {images.map((uri, index) => (
                            <View key={`${uri}-${index}`} style={{ width: 120, height: 160, borderRadius: 12, overflow: 'hidden' }}>
                                <Image source={{ uri }} style={{ width: 120, height: 160, borderRadius: 12 }} />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    style={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        borderRadius: 12,
                                        width: 24,
                                        height: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    disabled={uploading}
                                >
                                    <X color="#fff" size={14} />
                                </TouchableOpacity>
                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 6,
                                        left: 6,
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: 6,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#75716d' }}>{index + 1}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Add more button in strip */}
                        {images.length < MAX_IMAGES && (
                            <TouchableOpacity
                                onPress={pickImage}
                                style={{
                                    width: 120,
                                    height: 160,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderStyle: 'dashed',
                                    borderColor: '#e8c4b0',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                disabled={uploading}
                            >
                                <Plus color="#eb6e3e" size={24} />
                                <Text className="text-peach-600 text-xs mt-1 font-medium">{t.add.addMore}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {/* Add more via camera */}
                    {images.length < MAX_IMAGES && (
                        <TouchableOpacity
                            onPress={takePhoto}
                            className="flex-row items-center gap-2 mb-4"
                            disabled={uploading}
                        >
                            <Camera color="#eb6e3e" size={18} />
                            <Text className="text-peach-600 font-medium">{t.add.takePhoto}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Action buttons */}
                    <View className="flex-row gap-4 mt-2">
                        <TouchableOpacity
                            onPress={clearAllImages}
                            className="bg-warm-gray-200 p-4 rounded-full flex-row items-center gap-2"
                            disabled={uploading}
                        >
                            <Trash2 color="#75716d" size={20} />
                            <Text className="text-warm-gray-600 font-medium">{t.add.clearAll}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={uploadRecipe}
                            disabled={uploading}
                            className={`bg-peach-500 py-3 px-8 rounded-full flex-row items-center gap-2 ${uploading ? 'opacity-70' : ''}`}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <UploadCloud color="#fff" size={20} />
                            )}
                            <Text className="text-white font-semibold text-lg">
                                {uploading ? t.common.loading : t.recipes.newRecipe}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : showUrlInput ? (
                <View className="w-full gap-4">
                    <Text className="text-warm-gray-600 font-medium ml-1">{t.add.enterUrl}</Text>
                    <TextInput
                        value={urlValue}
                        onChangeText={setUrlValue}
                        placeholder={t.add.urlPlaceholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        className="bg-white border border-warm-gray-200 rounded-xl px-4 py-4 text-warm-gray-700 text-lg"
                    />
                    <View className="flex-row gap-4 mt-2">
                        <TouchableOpacity
                            onPress={() => {
                                setShowUrlInput(false);
                                setUrlValue("");
                            }}
                            className="bg-warm-gray-200 p-4 rounded-xl flex-1 items-center justify-center"
                            disabled={uploading}
                        >
                            <Text className="text-warm-gray-600 font-semibold">{t.common.cancel}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={scrapeRecipe}
                            disabled={uploading || !urlValue.trim()}
                            className={`bg-peach-500 py-4 rounded-xl flex-[2] flex-row items-center justify-center gap-2 ${(uploading || !urlValue.trim()) ? 'opacity-70' : ''}`}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <LinkIcon color="#fff" size={20} />
                            )}
                            <Text className="text-white font-semibold text-lg">
                                {uploading ? t.common.loading : t.add.scrape}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View className="w-full gap-4">
                    <TouchableOpacity
                        onPress={() => {
                            if (credits <= 0) {
                                setShowCreditModal(true);
                            } else {
                                takePhoto();
                            }
                        }}
                        className="bg-peach-500 p-6 rounded-2xl flex-row items-center justify-center gap-4 shadow-sm"
                    >
                        <Camera color="#fff" size={28} />
                        <Text className="text-white font-semibold text-xl">{t.add.takePhoto}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            if (credits <= 0) {
                                setShowCreditModal(true);
                            } else {
                                pickImage();
                            }
                        }}
                        className="bg-white border border-peach-200 p-6 rounded-2xl flex-row items-center justify-center gap-4"
                    >
                        <UploadCloud color="#eb6e3e" size={28} />
                        <Text className="text-peach-600 font-semibold text-xl">{t.add.chooseFromLibrary}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            if (credits <= 0) {
                                setShowCreditModal(true);
                            } else {
                                setShowUrlInput(true);
                            }
                        }}
                        className="bg-white border border-peach-200 p-6 rounded-2xl flex-row items-center justify-center gap-4"
                    >
                        <LinkIcon color="#eb6e3e" size={28} />
                        <Text className="text-peach-600 font-semibold text-xl">{t.add.addFromUrl}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/recipes/recipe-form", params: { mode: "create" } })}
                        className="bg-white border border-peach-200 p-6 rounded-2xl flex-row items-center justify-center gap-4"
                    >
                        <PenLine color="#eb6e3e" size={28} />
                        <Text className="text-peach-600 font-semibold text-xl">{t.add.writeManually}</Text>
                    </TouchableOpacity>

                    <Text className="text-warm-gray-400 text-center text-sm mt-2">{t.add.maxImages}</Text>
                </View>
            )}
        </View>
    );
}

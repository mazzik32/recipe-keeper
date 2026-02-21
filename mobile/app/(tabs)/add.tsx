import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera, RefreshCcw, UploadCloud, Link as LinkIcon } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { decode } from "base64-arraybuffer";
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AddRecipeScreen() {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlValue, setUrlValue] = useState("");
    const { user } = useAuth();
    const router = useRouter();
    const { t, locale } = useLanguage();

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow camera access to scan recipes.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadRecipe = async () => {
        if (!imageUri || !user) return;
        setUploading(true);

        try {
            // 1. Read the image as base64
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });

            // 2. Upload to Supabase Storage - matching web app's "original-scans" bucket
            const fileName = `${user.id}/scans/${Date.now()}-scan.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("original-scans")
                .upload(fileName, decode(base64), {
                    contentType: "image/jpeg",
                });

            if (uploadError) throw uploadError;

            // 3. Get signed URL (required by the Edge function)
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from("original-scans")
                .createSignedUrl(fileName, 3600);

            if (signedUrlError) throw signedUrlError;

            // 4. Call Supabase Edge Function to analyze
            const { data: sessionData } = await supabase.auth.getSession();

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-recipe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session?.access_token}`,
                    },
                    body: JSON.stringify({
                        imageUrls: [signedUrlData.signedUrl],
                        targetLanguage: "en", // Defaulting to english for v1
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to analyze recipe with AI.");
            }

            const result = await response.json();

            // 5. Navigate to Review Screen
            // In Expo Router, passing complex objects via search params is tricky.
            // We'll stringify it or ideally use a state management solution.
            // For now, stringify the essential data:
            const recipeToReview = {
                ...result.data,
                originalImageUrl: signedUrlData.signedUrl
            };

            setImageUri(null);
            setUploading(false);

            router.push({
                pathname: "/recipes/new",
                params: { recipe: JSON.stringify(recipeToReview) }
            });

        } catch (error: any) {
            Alert.alert("Analysis Failed", error.message);
            setUploading(false);
        }
    };

    const scrapeRecipe = async () => {
        if (!urlValue || !user) return;
        setUploading(true);

        try {
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
                pathname: "/recipes/new",
                params: { recipe: JSON.stringify(recipeToReview) }
            });

        } catch (error: any) {
            Alert.alert("Analysis Failed", error.message);
            setUploading(false);
        }
    };

    return (
        <View className="flex-1 bg-cream px-6 justify-center items-center">
            <Text className="font-playfair text-3xl text-warm-gray-700 mb-8 text-center">{t.add.addRecipeTitle}</Text>

            {imageUri ? (
                <View className="w-full items-center">
                    <Image source={{ uri: imageUri }} style={{ width: 300, height: 400, borderRadius: 12 }} />

                    <View className="flex-row gap-4 mt-6">
                        <TouchableOpacity
                            onPress={() => setImageUri(null)}
                            className="bg-warm-gray-200 p-4 rounded-full"
                            disabled={uploading}
                        >
                            <RefreshCcw color="#75716d" size={24} />
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
                        onPress={takePhoto}
                        className="bg-peach-500 p-6 rounded-2xl flex-row items-center justify-center gap-4 shadow-sm"
                    >
                        <Camera color="#fff" size={28} />
                        <Text className="text-white font-semibold text-xl">{t.add.takePhoto}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={pickImage}
                        className="bg-white border border-peach-200 p-6 rounded-2xl flex-row items-center justify-center gap-4"
                    >
                        <UploadCloud color="#eb6e3e" size={28} />
                        <Text className="text-peach-600 font-semibold text-xl">{t.add.chooseFromLibrary}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowUrlInput(true)}
                        className="bg-white border border-peach-200 p-6 rounded-2xl flex-row items-center justify-center gap-4"
                    >
                        <LinkIcon color="#eb6e3e" size={28} />
                        <Text className="text-peach-600 font-semibold text-xl">{t.add.addFromUrl}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

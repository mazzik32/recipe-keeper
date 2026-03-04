import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, ScrollView } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { X, Plus, Camera, UploadCloud, Link as LinkIcon, PenLine, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useCredits } from "../contexts/CreditsContext";
import WhiskLoader from "./WhiskLoader";
import CreditGateModal from "./CreditGateModal";
import { useTheme } from "../contexts/ThemeContext";

const MAX_IMAGES = 5;

interface AddRecipeScreenProps {
    onDismiss?: () => void;
}

export default function AddRecipeScreen({ onDismiss }: AddRecipeScreenProps) {
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const { colors } = useTheme();
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
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
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

    const clearAllImages = () => setImages([]);

    const uploadRecipe = async () => {
        if (images.length === 0 || !user) return;
        setUploading(true);
        try {
            const { error: consumeError } = await supabase.rpc("consume_single_credit");
            if (consumeError) {
                if (consumeError.message?.includes("insufficient_credits") || consumeError.code === "P0001") {
                    throw new Error("Insufficient credits. Please purchase more to continue scanning.");
                }
                throw new Error("Failed to verify credits: " + (consumeError.message || "Unknown error"));
            }
            await refreshCredits();

            const { data: sessionData } = await supabase.auth.getSession();
            const uploadedUrls: string[] = [];

            for (const imageUri of images) {
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
                if (!presignRes.ok) throw new Error("Failed to get secure upload URL");

                const { presignedUrl, publicUrl } = await presignRes.json();
                const imgRes = await fetch(imageUri);
                const imageBlob = await imgRes.blob();
                const uploadRes = await fetch(presignedUrl, {
                    method: "PUT",
                    headers: { "Content-Type": "image/jpeg" },
                    body: imageBlob,
                });
                if (!uploadRes.ok) throw new Error("Failed to upload image to Edge Storage");
                uploadedUrls.push(publicUrl);
            }

            const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-recipe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionData.session?.access_token}`,
                    },
                    body: JSON.stringify({ imageUrls: uploadedUrls, targetLanguage: locale }),
                }
            );
            if (!response.ok) throw new Error("Failed to analyze recipe with AI.");

            const result = await response.json();
            const recipeToReview = {
                ...result.data,
                originalImageUrl: uploadedUrls[0],
                originalImageUrls: uploadedUrls,
            };
            const imageCount = uploadedUrls.length;
            setImages([]);
            setUploading(false);
            onDismiss?.();
            router.push({
                pathname: "/recipes/recipe-form",
                params: { mode: "create", recipe: JSON.stringify(recipeToReview), scanImageCount: String(imageCount) }
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
            const { error: consumeError } = await supabase.rpc("consume_single_credit");
            if (consumeError) {
                if (consumeError.message?.includes("insufficient_credits") || consumeError.code === "P0001") {
                    throw new Error("Insufficient credits. Please purchase more to continue scanning.");
                }
                throw new Error("Failed to verify credits: " + (consumeError.message || "Unknown error"));
            }
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
                    body: JSON.stringify({ url: urlValue, targetLanguage: locale }),
                }
            );
            if (!response.ok) {
                let msg = "Failed to scrape recipe from URL.";
                try { const err = await response.json(); msg = err.error?.message || msg; } catch { }
                throw new Error(msg);
            }
            const result = await response.json();
            if (!result.success) throw new Error(result.error?.message || "Failed to parse recipe.");

            setUrlValue("");
            setShowUrlInput(false);
            setUploading(false);
            onDismiss?.();
            router.push({
                pathname: "/recipes/recipe-form",
                params: { mode: "create", recipe: JSON.stringify(result.data), scanImageCount: "0" }
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
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
            <CreditGateModal visible={showCreditModal} onClose={() => setShowCreditModal(false)} />

            {uploading && (
                <View style={{ position: 'absolute', inset: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fbfaf9' }}>
                    <WhiskLoader isAnalyzing={true} />
                </View>
            )}

            <Text style={{ fontFamily: 'Playfair Display', fontSize: 28, color: '#3d3632', marginBottom: 6, textAlign: 'center' }}>{t.add.addRecipeTitle}</Text>
            <Text style={{ color: '#75716d', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20, paddingHorizontal: 8 }}>{t.add.subtitle}</Text>

            {images.length > 0 ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: '#75716d', fontWeight: '500', marginBottom: 12 }}>
                        {images.length}/{MAX_IMAGES} {t.add.images}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
                        {images.map((uri, index) => (
                            <View key={`${uri}-${index}`} style={{ width: 120, height: 160, borderRadius: 12, overflow: 'hidden' }}>
                                <Image source={{ uri }} style={{ width: 120, height: 160, borderRadius: 12 }} />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                                    disabled={uploading}
                                >
                                    <X color="#fff" size={14} />
                                </TouchableOpacity>
                                <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#75716d' }}>{index + 1}</Text>
                                </View>
                            </View>
                        ))}
                        {images.length < MAX_IMAGES && (
                            <TouchableOpacity
                                onPress={pickImage}
                                style={{ width: 120, height: 160, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e8c4b0', alignItems: 'center', justifyContent: 'center' }}
                                disabled={uploading}
                            >
                                <Plus color="#eb6e3e" size={24} />
                                <Text style={{ color: '#eb6e3e', fontSize: 12, marginTop: 4, fontWeight: '500' }}>{t.add.addMore}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    {images.length < MAX_IMAGES && (
                        <TouchableOpacity onPress={takePhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }} disabled={uploading}>
                            <Camera color="#eb6e3e" size={18} />
                            <Text style={{ color: '#eb6e3e', fontWeight: '500' }}>{t.add.takePhoto}</Text>
                        </TouchableOpacity>
                    )}
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                        <TouchableOpacity onPress={clearAllImages} style={{ backgroundColor: '#e8e4e0', padding: 16, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 8 }} disabled={uploading}>
                            <Trash2 color={colors.text} size={20} />
                            <Text style={{ color: '#75716d', fontWeight: '500' }}>{t.add.clearAll}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={uploadRecipe} disabled={uploading} style={{ backgroundColor: '#eb6e3e', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: uploading ? 0.7 : 1 }}>
                            {uploading ? <ActivityIndicator color="#fff" /> : <UploadCloud color="#fff" size={20} />}
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 18 }}>{uploading ? t.common.loading : t.recipes.newRecipe}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : showUrlInput ? (
                <View style={{ width: '100%', gap: 16 }}>
                    <Text style={{ color: '#75716d', fontWeight: '500', marginLeft: 4 }}>{t.add.enterUrl}</Text>
                    <TextInput
                        value={urlValue}
                        onChangeText={setUrlValue}
                        placeholder={t.add.urlPlaceholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#dfd8d3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#3d3632', fontSize: 17 }}
                    />
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                        <TouchableOpacity onPress={() => { setShowUrlInput(false); setUrlValue(""); }} style={{ backgroundColor: '#e8e4e0', padding: 16, borderRadius: 12, flex: 1, alignItems: 'center' }} disabled={uploading}>
                            <Text style={{ color: '#75716d', fontWeight: '600' }}>{t.common.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={scrapeRecipe} disabled={uploading || !urlValue.trim()} style={{ backgroundColor: '#eb6e3e', paddingVertical: 16, borderRadius: 12, flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (uploading || !urlValue.trim()) ? 0.7 : 1 }}>
                            {uploading ? <ActivityIndicator color="#fff" /> : <LinkIcon color="#fff" size={20} />}
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 18 }}>{uploading ? t.common.loading : t.add.scrape}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ width: '100%', gap: 16 }}>
                    <TouchableOpacity
                        onPress={() => { if (credits <= 0) { setShowCreditModal(true); } else { takePhoto(); } }}
                        style={{ backgroundColor: '#eb6e3e', padding: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                    >
                        <Camera color="#fff" size={28} />
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 20 }}>{t.add.takePhoto}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { if (credits <= 0) { setShowCreditModal(true); } else { pickImage(); } }}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f5c8b4', padding: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                    >
                        <UploadCloud color="#eb6e3e" size={28} />
                        <Text style={{ color: '#eb6e3e', fontWeight: '600', fontSize: 20 }}>{t.add.chooseFromLibrary}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { if (credits <= 0) { setShowCreditModal(true); } else { setShowUrlInput(true); } }}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f5c8b4', padding: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                    >
                        <LinkIcon color="#eb6e3e" size={28} />
                        <Text style={{ color: '#eb6e3e', fontWeight: '600', fontSize: 20 }}>{t.add.addFromUrl}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { onDismiss?.(); router.push({ pathname: "/recipes/recipe-form", params: { mode: "create" } }); }}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f5c8b4', padding: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}
                    >
                        <PenLine color="#eb6e3e" size={28} />
                        <Text style={{ color: '#eb6e3e', fontWeight: '600', fontSize: 20 }}>{t.add.writeManually}</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#b8b5b2', textAlign: 'center', fontSize: 13, marginTop: 8 }}>{t.add.maxImages}</Text>
                </View>
            )}
        </View>
    );
}

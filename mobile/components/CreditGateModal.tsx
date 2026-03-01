import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Coffee, ShieldAlert } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

interface CreditGateModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function CreditGateModal({ visible, onClose }: CreditGateModalProps) {
    const { t } = useLanguage();
    const { user, refreshSession } = useAuth();
    const router = useRouter();

    // Refresh the session whenever the modal opens to make sure
    // we get the latest account status (e.g. if they just verified their email)
    useEffect(() => {
        if (visible) {
            refreshSession();
        }
    }, [visible]);

    const isAnonymous = user?.is_anonymous;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-cream rounded-t-3xl p-6 pb-12 shadow-lg">
                    <View className="items-center mb-6 mt-2">
                        <View className="w-12 h-1.5 bg-warm-gray-300 rounded-full mb-6" />

                        {isAnonymous ? (
                            <View className="w-16 h-16 bg-peach-100 rounded-full items-center justify-center mb-4">
                                <Coffee color="#eb6e3e" size={32} />
                            </View>
                        ) : (
                            <View className="w-16 h-16 bg-warm-gray-200 rounded-full items-center justify-center mb-4">
                                <ShieldAlert color="#75716d" size={32} />
                            </View>
                        )}

                        <Text className="font-playfair text-3xl text-warm-gray-700 text-center mb-2">
                            {isAnonymous
                                ? t.creditGate.freeScansUsedUp
                                : t.creditGate.outOfCredits}
                        </Text>
                        <Text className="text-warm-gray-500 text-center text-base px-2 leading-relaxed">
                            {isAnonymous
                                ? t.creditGate.freeScansDesc
                                : t.creditGate.outOfCreditsDesc}
                        </Text>
                    </View>

                    <View className="gap-3 mt-2">
                        {isAnonymous ? (
                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    router.push("/(auth)/signup");
                                }}
                                className="bg-peach-500 py-4 rounded-xl items-center justify-center shadow-sm"
                            >
                                <Text className="text-white font-semibold text-lg">
                                    {t.creditGate.createFreeAccount}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    router.push("/(tabs)/settings");
                                }}
                                className="bg-peach-500 py-4 rounded-xl items-center justify-center shadow-sm"
                            >
                                <Text className="text-white font-semibold text-lg">
                                    {t.creditGate.getMoreCredits}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={onClose}
                            className="py-4 rounded-xl items-center justify-center bg-white border border-warm-gray-200"
                        >
                            <Text className="text-warm-gray-600 font-medium text-base">
                                {t.common.cancel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
    const { initialized, session } = useAuth();

    if (!initialized) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fbfaf9', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#E07030" />
            </View>
        );
    }

    if (session) {
        return <Redirect href="/(tabs)" />;
    } else {
        return <Redirect href="/(auth)/login" />;
    }
}

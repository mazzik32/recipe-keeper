import { Tabs } from "expo-router";
import { Home, Search, Heart, Settings } from "lucide-react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { OnboardingModal } from "../../components/OnboardingModal";
import FABOverlay from "../../components/FABOverlay";

export default function TabLayout() {
    const { t } = useLanguage();

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#fbfaf9',
                        borderTopColor: '#f5f4f3',
                        borderTopWidth: 1,
                    },
                    tabBarActiveTintColor: '#eb6e3e',
                    tabBarInactiveTintColor: '#b8b5b2',
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t.nav.home,
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        title: t.nav.search,
                        tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
                        tabBarItemStyle: { paddingRight: 20 },
                    }}
                />
                {/* Hidden from tab bar — route kept alive for fallback navigation */}
                <Tabs.Screen name="add" options={{ href: null }} />
                <Tabs.Screen
                    name="favorites"
                    options={{
                        title: t.nav.favorites,
                        tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
                        tabBarItemStyle: { paddingLeft: 20 },
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: t.nav.settings,
                        tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                    }}
                />
                <Tabs.Screen name="settings/tags" options={{ href: null }} />
                <Tabs.Screen name="settings/buy-credits" options={{ href: null }} />
                <Tabs.Screen name="settings/collections" options={{ href: null }} />
            </Tabs>
            {/* Custom animated FAB — floats above the tab bar */}
            <FABOverlay />
            <OnboardingModal />
        </>
    );
}

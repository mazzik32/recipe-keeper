import { Tabs } from "expo-router";
import { Home, Search, Heart, Settings, Plus } from "lucide-react-native";
import { View } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";

export default function TabLayout() {
    const { t } = useLanguage();

    return (
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
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: t.nav.add,
                    tabBarIcon: ({ color, size }) => (
                        <View className="bg-peach-300 w-12 h-12 rounded-full items-center justify-center -mt-4 shadow-sm">
                            <Plus color="#3d3632" size={24} />
                        </View>
                    ),
                }}

            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: t.nav.favorites,
                    tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t.nav.settings,
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
            {/* Hide nested screens from the tab bar */}
            <Tabs.Screen
                name="settings/preferences"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

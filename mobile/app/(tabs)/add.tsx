import { View } from "react-native";
import AddRecipeScreen from "../../components/AddRecipeScreen";

export default function AddTab() {
    return (
        <View className="flex-1 bg-warm-white dark:bg-dark-bg">
            <AddRecipeScreen />
        </View>
    );
}

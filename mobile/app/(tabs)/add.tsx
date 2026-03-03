import { View } from "react-native";
import AddRecipeScreen from "../../components/AddRecipeScreen";

export default function AddTab() {
    return (
        <View style={{ flex: 1, backgroundColor: '#fbfaf9' }}>
            <AddRecipeScreen />
        </View>
    );
}

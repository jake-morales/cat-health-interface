import { ActivityIndicator, View } from "react-native";

// Loading screen shown briefly while _layout.tsx loads storage and redirects.
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
      <ActivityIndicator color="#4f46e5" size="large" />
    </View>
  );
}

import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSidebar } from "./_layout";

export default function HomeScreen() {
  const { toggle } = useSidebar();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={toggle} style={styles.hamburger}>
          <FontAwesome5 name="bars" size={20} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>Cat Health</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FontAwesome5 name="tools" size={56} color="#d1d5db" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.subtitle}>This page is under construction.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  hamburger: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6b7280", textAlign: "center" },
});

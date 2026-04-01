import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { CatProvider, useCats } from "../../lib/cat-context";
import { clearAuth } from "../../lib/auth";
import { clearSelectedCatId } from "../../lib/selected-cat";

const SIDEBAR_WIDTH = 280;

// ─── Sidebar Context ─────────────────────────────────────────────────────────

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ─── Cat Selector Modal ───────────────────────────────────────────────────────

function CatSelectorModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { cats, selectedCat, setSelectedCat } = useCats();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.catModal}>
        <Text style={styles.catModalTitle}>Select a cat</Text>
        {cats.length === 0 ? (
          <Text style={styles.catModalEmpty}>No cats yet</Text>
        ) : (
          <FlatList
            data={cats}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => {
              const active = selectedCat?.id === item.id;
              return (
                <Pressable
                  style={[styles.catOption, active && styles.catOptionActive]}
                  onPress={() => {
                    setSelectedCat(item.id);
                    onClose();
                  }}
                >
                  <View style={[styles.catAvatar, active && styles.catAvatarActive]}>
                    <Text style={[styles.catAvatarText, active && styles.catAvatarTextActive]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.catOptionName, active && styles.catOptionNameActive]}>
                    {item.name}
                  </Text>
                  {active && <Text style={styles.catCheckmark}>✓</Text>}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { cats, selectedCat } = useCats();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [catModalOpen, setCatModalOpen] = useState(false);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: open ? 0 : -SIDEBAR_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open]);

  function navigate(path: string) {
    onClose();
    router.push(path as any); // typed routes cast
  }

  async function handleLogout() {
    onClose();
    await clearAuth();
    await clearSelectedCatId();
    router.replace("/login" as any);
  }

  const isHome = pathname === "/" || pathname === "/(app)" || pathname === "/(app)/";
  const isPoops = pathname.includes("poops");
  const isSettings = pathname.includes("settings");

  return (
    <>
      {/* Backdrop */}
      {open && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Cat selector modal (on top of everything) */}
      <CatSelectorModal
        visible={catModalOpen}
        onClose={() => setCatModalOpen(false)}
      />

      {/* Sidebar panel */}
      <Animated.View
        style={[
          styles.sidebar,
          { paddingTop: insets.top, paddingBottom: insets.bottom, transform: [{ translateX }] },
        ]}
      >
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <FontAwesome5 name="paw" size={16} color="#4f46e5" />
          <Text style={styles.sidebarTitle}>Cat Health</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <FontAwesome5 name="times" size={18} color="#6b7280" />
          </Pressable>
        </View>

        {/* Cat selector */}
        <View style={styles.catSection}>
          <Pressable style={styles.catRow} onPress={() => setCatModalOpen(true)}>
            <View style={styles.catAvatarLarge}>
              <Text style={styles.catAvatarLargeText}>
                {selectedCat ? selectedCat.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <Text style={styles.catName} numberOfLines={1}>
              {selectedCat ? selectedCat.name : "Select a cat"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </Pressable>
        </View>

        {/* Nav items */}
        <View style={styles.nav}>
          <Pressable
            style={[styles.navItem, isHome && styles.navItemActive]}
            onPress={() => navigate("/(app)/")}
          >
            <FontAwesome5 name="home" size={16} color={isHome ? "#4338ca" : "#6b7280"} />
            <Text style={[styles.navLabel, isHome && styles.navLabelActive]}>Home</Text>
          </Pressable>
          <Pressable
            style={[styles.navItem, isPoops && styles.navItemActive]}
            onPress={() => navigate("/(app)/poops")}
          >
            <FontAwesome5 name="poop" size={16} color={isPoops ? "#4338ca" : "#6b7280"} />
            <Text style={[styles.navLabel, isPoops && styles.navLabelActive]}>Poops</Text>
          </Pressable>
        </View>

        {/* Bottom actions */}
        <View style={styles.sidebarBottom}>
          <Pressable
            style={[styles.navItem, isSettings && styles.navItemActive]}
            onPress={() => navigate("/(app)/settings")}
          >
            <FontAwesome5 name="cog" size={16} color={isSettings ? "#4338ca" : "#6b7280"} />
            <Text style={[styles.navLabel, isSettings && styles.navLabelActive]}>Settings</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={handleLogout}>
            <FontAwesome5 name="sign-out-alt" size={16} color="#6b7280" />
            <Text style={styles.navLabel}>Log out</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────

export default function AppLayout() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const close = useCallback(() => setSidebarOpen(false), []);
  const toggle = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <CatProvider onUnauthorized={async () => router.replace("/login" as any)}>
      <SidebarContext.Provider value={{ open: sidebarOpen, toggle, close }}>
        <View style={styles.root}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: "#4f46e5",
              tabBarInactiveTintColor: "#9ca3af",
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabBarLabel,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color, size }) => (
                  <FontAwesome5 name="home" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="poops"
              options={{
                href: null,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: "Settings",
                tabBarIcon: ({ color, size }) => (
                  <FontAwesome5 name="cog" size={size} color={color} />
                ),
              }}
            />
          </Tabs>

          <Sidebar open={sidebarOpen} onClose={close} />
        </View>
      </SidebarContext.Provider>
    </CatProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Tab bar
  tabBar: {
    backgroundColor: "#fff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
  },
  tabBarLabel: { fontSize: 12, fontWeight: "500" },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },

  // Sidebar panel
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sidebarTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  closeBtn: { padding: 4 },

  // Cat section
  catSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  catAvatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  catAvatarLargeText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  catName: { flex: 1, fontSize: 14, color: "#374151" },
  dropdownArrow: { fontSize: 10, color: "#9ca3af" },

  // Nav
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 16, gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navItemActive: { backgroundColor: "#eef2ff" },
  navLabel: { fontSize: 14, fontWeight: "500", color: "#6b7280" },
  navLabelActive: { color: "#4338ca" },

  // Bottom
  sidebarBottom: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 4,
  },

  // Cat modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  catModal: {
    position: "absolute",
    top: "30%",
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  catModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  catModalEmpty: { color: "#9ca3af", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  catOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  catOptionActive: { backgroundColor: "#eef2ff" },
  catAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  catAvatarActive: { backgroundColor: "#4f46e5" },
  catAvatarText: { fontSize: 12, fontWeight: "700", color: "#4338ca" },
  catAvatarTextActive: { color: "#fff" },
  catOptionName: { flex: 1, fontSize: 14, color: "#374151" },
  catOptionNameActive: { color: "#4338ca", fontWeight: "500" },
  catCheckmark: { color: "#4338ca", fontWeight: "700" },
});

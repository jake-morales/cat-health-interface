import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { loadAuthFromStorage, isLoggedIn } from "../lib/auth";
import { loadSelectedCatFromStorage } from "../lib/selected-cat";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function prepare() {
      await Promise.all([loadAuthFromStorage(), loadSelectedCatFromStorage()]);
      setReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();

    const seg = segments[0] as string;
    const inApp = seg === "(app)";
    const onAuthScreen = seg === "login" || seg === "signup";

    if (!isLoggedIn() && !onAuthScreen) {
      // Not logged in and not already on an auth screen → go to login
      router.replace("/login" as any);
    } else if (isLoggedIn() && !inApp) {
      // Logged in but not in the app group → go to app
      router.replace("/(app)/" as any);
    }
  }, [ready, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

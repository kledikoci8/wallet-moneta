import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function Layout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { COLORS } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [onboarded, setOnboarded] = useState(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check onboarding status only once when auth is loaded
  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.getItem("@wallet_onboarded")
      .then((v) => {
        setOnboarded(v === "true");
      })
      .catch((error) => {
        console.error("[Root Layout] Error checking onboarding:", error);
        setOnboarded(false);
      })
      .finally(() => {
        setInitialCheckDone(true);
      });
  }, [isLoaded]);

  // Handle navigation based on auth and onboarding state
  useEffect(() => {
    if (!isLoaded || onboarded === null || !initialCheckDone) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[1] === "onboarding";

    // Priority 1: Not signed in → go to sign-in
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/sign-in");
    } 
    // Priority 2: Signed in but not onboarded → go to onboarding
    else if (isSignedIn && !onboarded && !inOnboarding) {
      router.replace("/onboarding");
    } 
    // Priority 3: Signed in and onboarded but in auth/onboarding → go to home
    else if (isSignedIn && onboarded && (inAuthGroup || inOnboarding)) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, onboarded, segments, initialCheckDone]);

  // Show loading screen while checking auth or onboarding
  if (!isLoaded || onboarded === null || !initialCheckDone) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.textLight }}>
          {!isLoaded ? "Initializing..." : "Loading..."}
        </Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

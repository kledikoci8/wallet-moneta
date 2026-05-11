import { useUser } from "@clerk/clerk-expo";
import { Redirect, useSegments } from "expo-router";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();
  const segments = useSegments();
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("@wallet_onboarded").then((v) => setOnboarded(v === "true"));
  }, [isSignedIn, segments]);

  if (!isLoaded || onboarded === null) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

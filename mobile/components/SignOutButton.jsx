import { useClerk } from "@clerk/clerk-expo";
import { TouchableOpacity, Alert } from "react-native";
import { useMemo } from "react";
import { createHomeStyles } from "../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);

  const handleSignOut = async () => {
    Alert.alert("Confirm Log Out", "Are you sure you want to Log Out?", [
      { text: "Cancel", style: "cancel " },
      { text: "LogOut", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
      <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  );
};

import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../hooks/useTheme";
import { useRouter } from "expo-router";

const NoTransactionsFound = () => {
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.emptyState}>
      <Ionicons
        name="receipt-outline"
        size={60}
        color={COLORS.textLight}
        style={styles.emptyStateIcon}
      />
      <Text style={styles.emptyStateTitle}>No transactions yet</Text>
      <Text style={styles.emptyStateText}>
        Start tracking your finances by adding your first transaction
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add-circle" size={18} color={COLORS.white} />
        <Text style={styles.emptyStateButtonText}>Add your first transaction</Text>
      </TouchableOpacity>
    </View>
  );
};
export default NoTransactionsFound;

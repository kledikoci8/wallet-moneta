import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../hooks/useTheme";
import { createGoalsStyles } from "../../assets/styles/goals.styles";
import { API_URL } from "../../constants/api";
import { useCurrency } from "../../hooks/useCurrency";
import { useDateFormat } from "../../hooks/useDateFormat";

const DEFAULT_TX_KEY = "@wallet_default_tx_type";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS, themeMode, setThemeMode, isDark } = useTheme();
  const styles = useMemo(() => createGoalsStyles(COLORS), [COLORS]);
  const { code, setCode, reload: reloadCurrency } = useCurrency();
  const { formatKey, setFormatKey, reload: reloadDate } = useDateFormat();
  const [defaultTx, setDefaultTx] = useState("expense");
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(DEFAULT_TX_KEY).then((v) => {
      if (v === "income" || v === "expense") setDefaultTx(v);
    });
  }, []);

  const initials =
    (user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "?").toUpperCase();

  const pickCurrency = (c) => {
    setCode(c);
    reloadCurrency();
  };

  const pickDateFmt = async (k) => {
    await setFormatKey(k);
    reloadDate();
  };

  const setDefaultTransactionType = async (t) => {
    setDefaultTx(t);
    await AsyncStorage.setItem(DEFAULT_TX_KEY, t);
  };

  const deleteAll = () => {
    Alert.alert(
      "Delete all my data",
      "This will permanently delete all your transactions and goals. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/users/${user.id}`, { method: "DELETE" });
              if (!res.ok) throw new Error();
              Alert.alert("Done", "Your data was deleted.");
              router.back();
            } catch {
              Alert.alert("Error", "Could not delete data");
            }
          },
        },
      ]
    );
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/transactions/export/${user.id}`);
      if (!res.ok) throw new Error();
      const text = await res.text();
      const path = `${FileSystem.cacheDirectory}transactions.csv`;
      await FileSystem.writeAsStringAsync(path, text);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert("Exported", path);
      }
    } catch (e) {
      Alert.alert("Error", "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 8 }}>
          Profile
        </Text>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "700" }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
              {user?.fullName || "User"}
            </Text>
            <Text style={{ color: COLORS.textLight, marginTop: 4 }}>
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 8 }}>
          Preferences
        </Text>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "600", marginBottom: 8 }}>Currency</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["USD", "EUR", "ALL", "GBP", "JPY", "CAD"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => pickCurrency(c)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: code === c ? COLORS.primary : COLORS.border,
                  backgroundColor: code === c ? COLORS.primary + "22" : "transparent",
                }}
              >
                <Text style={{ color: COLORS.text }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: COLORS.text, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
            Default transaction type
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {["expense", "income"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setDefaultTransactionType(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: defaultTx === t ? COLORS.primary : COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text }}>{t === "expense" ? "Expense" : "Income"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: COLORS.text, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
            Date format
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { k: "mmdd", l: "Long (US)" },
              { k: "ddmm", l: "DD/MM/YYYY" },
              { k: "iso", l: "YYYY-MM-DD" },
            ].map((o) => (
              <TouchableOpacity
                key={o.k}
                onPress={() => pickDateFmt(o.k)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: formatKey === o.k ? COLORS.primary : COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text }}>{o.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 8 }}>
          Appearance
        </Text>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "600" }}>Dark mode</Text>
          <Switch
            value={themeMode === "dark" || (themeMode === "system" && isDark)}
            onValueChange={(v) => setThemeMode(v ? "dark" : "light")}
          />
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textLight, marginBottom: 8 }}>
          Data
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
          onPress={exportCsv}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Export transactions (CSV)</Text>
          )}
        </TouchableOpacity>

        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.expense, marginBottom: 8 }}>
          Danger zone
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.expense + "18",
            borderRadius: 16,
            padding: 16,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: COLORS.expense,
          }}
          onPress={deleteAll}
        >
          <Text style={{ color: COLORS.expense, fontWeight: "700", textAlign: "center" }}>
            Delete all my data
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

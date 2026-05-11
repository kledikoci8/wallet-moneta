import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { createBudgetsStyles } from "../../assets/styles/budgets.styles";
import { API_URL } from "../../constants/api";
import PageLoader from "../../components/PageLoader";
import { TRANSACTION_CATEGORIES } from "../../constants/transactionCategories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import EmptyBudgets from "../../components/EmptyBudgets";

const CATEGORY_ICONS = {
  "Food & Drinks": "fast-food",
  Shopping: "cart",
  Transportation: "car",
  Entertainment: "film",
  Bills: "receipt",
  Income: "cash",
  Other: "ellipsis-horizontal",
};

export default function BudgetsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createBudgetsStyles(COLORS), [COLORS]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [limitInput, setLimitInput] = useState("");
  const [categoryPick, setCategoryPick] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_URL}/budgets/${user.id}?month=${month}&year=${year}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`${API_URL}/budgets/status/${user.id}?month=${month}&year=${year}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ]);
      
      if (!bRes.ok || !sRes.ok) {
        throw new Error("Failed to fetch budgets");
      }
      
      const b = await bRes.json();
      const s = await sRes.json();
      setBudgets(Array.isArray(b) ? b : []);
      setStatus(Array.isArray(s) ? s : []);

      for (const row of s) {
        if (row.percent_used >= 80 && row.status !== "ok") {
          const key = `@budget_warn_${user.id}_${row.category}_${month}_${year}`;
          const sent = await AsyncStorage.getItem(key);
          if (!sent) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Budget Warning — ${row.category}`,
                  body: `You've used ${row.percent_used.toFixed(0)}% of your ${row.category} budget`,
                },
                trigger: null,
              });
              await AsyncStorage.setItem(key, "1");
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.error("[Budgets] Error loading data:", e);
      setBudgets([]);
      setStatus([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, month, year]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const overCount = status.filter((r) => r.status === "over").length;

  const openAdd = () => {
    setEditId(null);
    setCategoryPick("");
    setLimitInput("");
    setModal(true);
  };

  const openEdit = (b) => {
    setEditId(b.id);
    setCategoryPick(b.category);
    setLimitInput(String(b.limit_amount));
    setModal(true);
  };

  const saveBudget = async () => {
    if (!categoryPick || !limitInput) {
      Alert.alert("Error", "Category and limit required");
      return;
    }
    try {
      if (editId) {
        const res = await fetch(`${API_URL}/budgets/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit_amount: parseFloat(limitInput) }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`${API_URL}/budgets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            category: categoryPick,
            limit_amount: parseFloat(limitInput),
            month,
            year,
          }),
        });
        if (!res.ok) throw new Error();
      }
      setModal(false);
      load();
    } catch {
      Alert.alert("Error", "Could not save budget");
    }
  };

  const deleteBudget = (id) => {
    Alert.alert("Delete", "Remove this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/budgets/${id}`, { method: "DELETE" });
          load();
        },
      },
    ]);
  };

  if (loading && !refreshing) return <PageLoader />;

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budgets</Text>
        <TouchableOpacity style={styles.backButton} onPress={openAdd}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {overCount} of {status.length || budgets.length} categories over budget this month
          </Text>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <EmptyBudgets onAdd={openAdd} />
        ) : (
          budgets.map((b) => {
            const st = status.find((s) => s.category === b.category) || b;
            const pct = Math.min(st.percent_used || 0, 100);
            let barColor = COLORS.income;
            if (st.percent_used > 100) barColor = COLORS.expense;
            else if (st.percent_used > 80) barColor = "#FF9800";
            return (
              <TouchableOpacity key={b.id} style={styles.row} onPress={() => openEdit(b)}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={CATEGORY_ICONS[b.category] || "pricetag"}
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.rowTitle}>{b.category}</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.meta}>
                  Spent ${parseFloat(st.spent_amount ?? b.spent_amount ?? 0).toFixed(0)} / limit $
                  {parseFloat(b.limit_amount).toFixed(0)} — remaining $
                  {parseFloat(st.remaining ?? b.remaining ?? 0).toFixed(0)}
                </Text>
                <TouchableOpacity onPress={() => deleteBudget(b.id)} style={{ marginTop: 8 }}>
                  <Text style={{ color: COLORS.expense }}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 12 }}>
              {editId ? "Edit budget" : "Add budget"}
            </Text>
            {!editId && (
              <ScrollView horizontal style={{ marginBottom: 12 }}>
                {TRANSACTION_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoryPick(c.name)}
                    style={{
                      padding: 10,
                      marginRight: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: categoryPick === c.name ? COLORS.primary : COLORS.border,
                      backgroundColor: categoryPick === c.name ? COLORS.primary + "22" : COLORS.card,
                    }}
                  >
                    <Text style={{ color: COLORS.text }}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TextInput
              style={styles.input}
              placeholder="Monthly limit"
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity style={styles.btn} onPress={saveBudget}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => setModal(false)}>
              <Text style={{ color: COLORS.textLight }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

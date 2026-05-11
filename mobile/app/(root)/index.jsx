import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Animated,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFocusEffect } from "@react-navigation/native";
import PageLoader from "../../components/PageLoader";
import { createHomeStyles } from "../../assets/styles/home.styles";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { BalanceCard } from "../../components/BalanceCard";
import { TransactionItem } from "../../components/TransactionItem";
import { Alert } from "react-native";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { RefreshControl } from "react-native";
import { API_URL } from "../../constants/api";
import { useTransactionFilters } from "../../hooks/useTransactionFilters";
import { TRANSACTION_CATEGORIES } from "../../constants/transactionCategories";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Toast } from "../../components/Toast";
import { useNotifications } from "../../hooks/useNotifications";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);

  const [refreshing, setRefreshing] = useState(false);
  const [showLossAlert, setShowLossAlert] = useState(false);
  const [lossAmount, setLossAmount] = useState(0);
  const previousBalance = useRef(null);
  const { transactions, summary, loadData, deleteTransaction, IsLoading } =
    useTransactions(user.id);

  useNotifications();
  const filters = useTransactionFilters(transactions);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const checkMonthlyLoss = useCallback(
    async (checkForNewExpense = false) => {
      try {
        const response = await fetch(`${API_URL}/transactions/analytics/${user.id}`);
        const data = await response.json();

        if (data.monthlyData && data.monthlyData.length > 0) {
          const currentMonth = new Date().toLocaleString("en-US", { month: "short" });
          const currentMonthData = data.monthlyData.find((m) => m.month === currentMonth);

          if (currentMonthData) {
            const income = currentMonthData.income || 0;
            const expense = Math.abs(currentMonthData.expense || 0);
            const netAmount = income - expense;

            if (netAmount < 0) {
              const currentLoss = Math.abs(netAmount);
              if (checkForNewExpense) {
                setLossAmount(currentLoss);
                setShowLossAlert(true);
              } else if (previousBalance.current === null) {
                setLossAmount(currentLoss);
                setShowLossAlert(true);
              }
            }
            previousBalance.current = netAmount;
          }
        }
      } catch (error) {
        console.error("Error checking monthly loss:", error);
      }
    },
    [user.id]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const timer = setTimeout(() => {
        if (user.id) {
          const isReturning = previousBalance.current !== null;
          checkMonthlyLoss(isReturning);
        }
      }, 500);
      return () => clearTimeout(timer);
    }, [user.id])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteTransaction(id, {
            onRollback: () => {
              setToastMsg("Could not delete — list restored");
              setToastVisible(true);
            },
          }),
      },
    ]);
  };

  const dismissLossAlert = () => setShowLossAlert(false);

  const alertStyles = useMemo(() => makeAlertStyles(COLORS), [COLORS]);
  const floatingStyles = useMemo(() => makeFloatingStyles(COLORS), [COLORS]);

  if (IsLoading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.analyticsButton}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.analyticsButton}
              onPress={() => router.push("/budgets")}
            >
              <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyticsButton} onPress={() => router.push("/goals")}>
              <Ionicons name="flag" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.analyticsButton}
              onPress={() => router.push("/analytics")}
            >
              <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <SignOutButton />
          </View>
        </View>

        <BalanceCard summary={summary} />

        <View
          style={[
            filterStyles.searchWrap,
            { borderColor: COLORS.border, backgroundColor: COLORS.card },
          ]}
        >
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={filterStyles.searchInput}
            placeholder="Search title or category"
            placeholderTextColor={COLORS.textLight}
            value={filters.search}
            onChangeText={filters.setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={filterStyles.row}>
          {["all", "income", "expense"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                filterStyles.pill,
                filters.typeFilter === t && { backgroundColor: COLORS.primary },
              ]}
              onPress={() => filters.setTypeFilter(t)}
            >
              <Text
                style={[
                  filterStyles.pillText,
                  filters.typeFilter === t && { color: COLORS.white },
                ]}
              >
                {t === "all" ? "All" : t === "income" ? "Income" : "Expense"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={filterStyles.row}>
          <TouchableOpacity
            style={[
              filterStyles.pill,
              !filters.categoryFilter && { backgroundColor: COLORS.border },
            ]}
            onPress={() => filters.setCategoryFilter(null)}
          >
            <Text style={filterStyles.pillText}>All categories</Text>
          </TouchableOpacity>
          {TRANSACTION_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                filterStyles.pill,
                filters.categoryFilter === c.name && { backgroundColor: COLORS.primary },
              ]}
              onPress={() => filters.setCategoryFilter(c.name)}
            >
              <Text
                style={[
                  filterStyles.pillText,
                  filters.categoryFilter === c.name && { color: COLORS.white },
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={filterStyles.row}>
          {[
            { id: "newest", label: "Newest" },
            { id: "oldest", label: "Oldest" },
            { id: "highest", label: "Highest" },
            { id: "lowest", label: "Lowest" },
          ].map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                filterStyles.pill,
                filters.sort === s.id && { backgroundColor: COLORS.primary },
              ]}
              onPress={() => filters.setSort(s.id)}
            >
              <Text
                style={[
                  filterStyles.pillText,
                  filters.sort === s.id && { color: COLORS.white },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={filterStyles.rowBetween}>
          <TouchableOpacity
            style={[
              filterStyles.pill,
              filters.dateRangeEnabled && { backgroundColor: COLORS.primary },
            ]}
            onPress={() => filters.setDateRangeEnabled(!filters.dateRangeEnabled)}
          >
            <Text
              style={[
                filterStyles.pillText,
                filters.dateRangeEnabled && { color: COLORS.white },
              ]}
            >
              Date range
            </Text>
          </TouchableOpacity>
          {filters.hasActiveFilters && (
            <TouchableOpacity onPress={filters.clearAll}>
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {filters.dateRangeEnabled && (
          <View style={filterStyles.dateRow}>
            <TouchableOpacity
              style={filterStyles.dateBtn}
              onPress={() => {
                setPickerTarget("from");
                setPickerOpen(true);
              }}
            >
              <Text style={{ color: COLORS.text }}>
                From:{" "}
                {filters.dateFrom
                  ? filters.dateFrom.toISOString().slice(0, 10)
                  : "tap"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={filterStyles.dateBtn}
              onPress={() => {
                setPickerTarget("to");
                setPickerOpen(true);
              }}
            >
              <Text style={{ color: COLORS.text }}>
                To:{" "}
                {filters.dateTo ? filters.dateTo.toISOString().slice(0, 10) : "tap"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {filters.hasActiveFilters && (
          <Text style={filterStyles.count}>
            {filters.filtered.length} result{filters.filtered.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {pickerOpen && Platform.OS === "android" && (
        <DateTimePicker
          value={
            pickerTarget === "from"
              ? filters.dateFrom || new Date()
              : filters.dateTo || new Date()
          }
          mode="date"
          display="default"
          onChange={(e, d) => {
            setPickerOpen(false);
            if (d) {
              if (pickerTarget === "from") filters.setDateFrom(d);
              else filters.setDateTo(d);
            }
          }}
        />
      )}

      {pickerOpen && Platform.OS === "ios" && (
        <Modal visible={pickerOpen} transparent animationType="slide">
          <View style={filterStyles.modalBg}>
            <View style={[filterStyles.modalCard, { backgroundColor: COLORS.card }]}>
              <DateTimePicker
                value={
                  pickerTarget === "from"
                    ? filters.dateFrom || new Date()
                    : filters.dateTo || new Date()
                }
                mode="date"
                display="spinner"
                onChange={(e, d) => {
                  if (d) {
                    if (pickerTarget === "from") filters.setDateFrom(d);
                    else filters.setDateTo(d);
                  }
                }}
              />
              <TouchableOpacity
                style={filterStyles.doneBtn}
                onPress={() => setPickerOpen(false)}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={filters.filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onDelete={handleDelete}
            onEdit={(tx) => router.push(`/edit-transaction?id=${tx.id}`)}
          />
        )}
        ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <Animated.View style={[floatingStyles.container, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={floatingStyles.button}
          onPress={() => router.push("/chat")}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        COLORS={COLORS}
      />

      <Modal
        visible={showLossAlert}
        transparent
        animationType="fade"
        onRequestClose={dismissLossAlert}
      >
        <View style={alertStyles.overlay}>
          <View style={alertStyles.container}>
            <View style={alertStyles.iconContainer}>
              <Ionicons name="warning" size={50} color={COLORS.expense} />
            </View>
            <Text style={alertStyles.title}>Monthly Loss Alert!</Text>
            <Text style={alertStyles.message}>
              You're spending more than you earn this month.
            </Text>
            <View style={alertStyles.amountContainer}>
              <Text style={alertStyles.amountLabel}>Current Loss</Text>
              <Text style={alertStyles.amount}>-${lossAmount.toFixed(2)}</Text>
            </View>
            <Text style={alertStyles.tip}>
              Tip: Review your expenses and try to cut back on non-essential spending.
            </Text>
            <View style={alertStyles.buttonContainer}>
              <TouchableOpacity
                style={alertStyles.secondaryButton}
                onPress={() => {
                  dismissLossAlert();
                  router.push("/analytics");
                }}
              >
                <Ionicons name="stats-chart" size={18} color={COLORS.primary} />
                <Text style={alertStyles.secondaryButtonText}>View Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={alertStyles.primaryButton} onPress={dismissLossAlert}>
                <Text style={alertStyles.primaryButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const filterStyles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8 },
  row: { marginBottom: 8, maxHeight: 40 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  pillText: { fontSize: 13, color: "#1B5E20" },
  count: { fontSize: 13, color: "#66BB6A", marginBottom: 6 },
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  dateBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#fff",
  },
  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  doneBtn: { alignItems: "center", padding: 12 },
});

function makeAlertStyles(COLORS) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    container: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 24,
      width: "100%",
      maxWidth: 340,
      alignItems: "center",
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.expense + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: COLORS.expense,
      marginBottom: 8,
      textAlign: "center",
    },
    message: {
      fontSize: 15,
      color: COLORS.textLight,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 22,
    },
    amountContainer: {
      backgroundColor: COLORS.expense + "10",
      borderRadius: 16,
      padding: 16,
      width: "100%",
      alignItems: "center",
      marginBottom: 16,
    },
    amountLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
    amount: { fontSize: 32, fontWeight: "700", color: COLORS.expense },
    tip: {
      fontSize: 13,
      color: COLORS.text,
      textAlign: "center",
      backgroundColor: "#FFF9E6",
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      lineHeight: 20,
    },
    buttonContainer: { flexDirection: "row", gap: 12, width: "100%" },
    primaryButton: {
      flex: 1,
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    secondaryButton: {
      flex: 1,
      backgroundColor: COLORS.primary + "15",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    secondaryButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  });
}

function makeFloatingStyles(COLORS) {
  return StyleSheet.create({
    container: { position: "absolute", bottom: 30, right: 20, zIndex: 1000 },
    button: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  });
}

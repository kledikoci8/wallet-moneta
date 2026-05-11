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
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFocusEffect } from "@react-navigation/native";
import PageLoader from "../../components/PageLoader";
import { createHomeStyles } from "../../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { BalanceCard } from "../../components/BalanceCard";
import { TransactionItem } from "../../components/TransactionItem";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { API_URL } from "../../constants/api";
import { useTransactionFilters } from "../../hooks/useTransactionFilters";
import { TRANSACTION_CATEGORIES } from "../../constants/transactionCategories";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Toast } from "../../components/Toast";
import { useNotifications } from "../../hooks/useNotifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Menu items defined outside component to avoid hooks issues
const MENU_ITEMS = [
  { icon: "stats-chart", label: "Analytics", route: "/analytics" },
  { icon: "flag", label: "Savings Goals", route: "/goals" },
  { icon: "wallet-outline", label: "Budgets", route: "/budgets" },
  { icon: "settings-outline", label: "Settings", route: "/settings" },
];

export default function Page() {
  const { user } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [showLossAlert, setShowLossAlert] = useState(false);
  const [lossAmount, setLossAmount] = useState(0);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const previousBalance = useRef(null);
  const { transactions, summary, loadData, deleteTransaction, IsLoading, error } =
    useTransactions(userId);

  useNotifications();
  const filters = useTransactionFilters(transactions);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (IsLoading) {
        setLoadTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [IsLoading]);

  const checkMonthlyLoss = useCallback(
    async (checkForNewExpense = false) => {
      if (!userId) return;
      try {
        const response = await fetch(`${API_URL}/transactions/analytics/${userId}`);
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
    [userId]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Load data only once on mount or when userId changes
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]); // ✅ Only depend on userId, not loadData

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadData();
        const timer = setTimeout(() => {
          const isReturning = previousBalance.current !== null;
          checkMonthlyLoss(isReturning);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [userId]) // ✅ Only depend on userId
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

  if (!userId) {
    return <PageLoader />;
  }
  
  if (IsLoading && !refreshing && !loadTimeout) {
    return <PageLoader />;
  }

  if (loadTimeout || error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: COLORS.text }]}>
              Connection Issue
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Ionicons name="cloud-offline-outline" size={64} color={COLORS.textLight} />
            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "600", color: COLORS.text, textAlign: "center" }}>
              Unable to connect to server
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: COLORS.textLight, textAlign: "center" }}>
              {error || "The request timed out. Please check your connection and try again."}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 24,
                backgroundColor: COLORS.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              onPress={() => {
                setLoadTimeout(false);
                loadData();
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Get user's display name
  const getUserDisplayName = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.fullName) {
      return user.fullName.split(' ')[0]; // Get first name from full name
    }
    if (user?.username) {
      return user.username;
    }
    // Fallback to email username
    return user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ?? "User";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Hamburger Menu Button */}
            <TouchableOpacity 
              style={styles.hamburgerButton}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu" size={28} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Logo */}
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {getUserDisplayName()}!
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <SignOutButton />
          </View>
        </View>

        <BalanceCard
          summary={summary}
          transactions={transactions}
          accountName={getUserDisplayName()}
        />

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
        contentContainerStyle={[
          styles.transactionsListContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 16 + 56 + 20 },
        ]}
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

      <TouchableOpacity
        style={[styles.finbotFab, { bottom: Math.max(insets.bottom, 12) + 16 }]}
        onPress={() => router.push("/chat")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open FinBot chat"
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={menuStyles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[menuStyles.menuContainer, { backgroundColor: COLORS.card }]}>
            {/* Menu Header */}
            <View style={menuStyles.menuHeader}>
              <View style={menuStyles.menuHeaderLeft}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={menuStyles.menuLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={[menuStyles.menuTitle, { color: COLORS.text }]}>Menu</Text>
                  <Text style={[menuStyles.menuSubtitle, { color: COLORS.textLight }]}>
                    {getUserDisplayName()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={menuStyles.menuItems}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[menuStyles.menuItem, { borderBottomColor: COLORS.border }]}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(item.route);
                  }}
                >
                  <View style={[menuStyles.menuIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                    <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                  </View>
                  <Text style={[menuStyles.menuItemText, { color: COLORS.text }]}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Menu Footer */}
            <View style={menuStyles.menuFooter}>
              <Text style={[menuStyles.menuFooterText, { color: COLORS.textLight }]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  menuContainer: {
    width: "80%",
    maxWidth: 320,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  menuHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuLogo: {
    width: 50,
    height: 50,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  menuSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  menuItems: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  menuFooter: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  menuFooterText: {
    fontSize: 12,
  },
});

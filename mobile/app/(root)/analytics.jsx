import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import { createAnalyticsStyles } from "../../assets/styles/analytics.styles";
import { useTheme } from "../../hooks/useTheme";
import { API_URL } from "../../constants/api";
import PageLoader from "../../components/PageLoader";
import { IncomeExpenseChart } from "../../components/IncomeExpenseChart";
import { ProfitLossCalendar } from "../../components/ProfitLossCalendar";
import { CategoryDonutChart } from "../../components/CategoryDonutChart";
import EmptyAnalytics from "../../components/EmptyAnalytics";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createAnalyticsStyles(COLORS), [COLORS]);
  const [showCalendar, setShowCalendar] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [chartMonth, setChartMonth] = useState(now.getMonth() + 1);
  const [chartYear, setChartYear] = useState(now.getFullYear());

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resA, resC] = await Promise.all([
        fetch(`${API_URL}/transactions/analytics/${user.id}`),
        fetch(
          `${API_URL}/transactions/categories/${user.id}?month=${chartMonth}&year=${chartYear}`
        ),
      ]);
      const data = await resA.json();
      const catJson = await resC.json();
      setAnalyticsData(data);
      setCategoryData(catJson.categories || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, chartMonth, chartYear]);

  useFocusEffect(
    useCallback(() => {
      fetchAnalyticsData();
    }, [fetchAnalyticsData])
  );

  const prevMonth = () => {
    if (chartMonth === 1) {
      setChartMonth(12);
      setChartYear((y) => y - 1);
    } else setChartMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (chartMonth === 12) {
      setChartMonth(1);
      setChartYear((y) => y + 1);
    } else setChartMonth((m) => m + 1);
  };

  if (isLoading && !refreshing) return <PageLoader />;

  const hasData =
    analyticsData &&
    ((analyticsData.monthlyData && analyticsData.monthlyData.length > 0) ||
      (analyticsData.dailyData && analyticsData.dailyData.length > 0));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchAnalyticsData();
              setRefreshing(false);
            }}
          />
        }
      >
        {!hasData ? (
          <EmptyAnalytics />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Income vs Expense</Text>
              <IncomeExpenseChart data={analyticsData} COLORS={COLORS} />
            </View>

            <View style={styles.section}>
              <View style={styles.calendarHeader}>
                <Text style={styles.sectionTitle}>Spending by Category</Text>
              </View>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={prevMonth}>
                  <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  {new Date(chartYear, chartMonth - 1, 1).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity onPress={nextMonth}>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <CategoryDonutChart categories={categoryData} />
            </View>

            <View style={styles.section}>
              <View style={styles.calendarHeader}>
                <Text style={styles.sectionTitle}>Daily Profit/Loss</Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowCalendar(!showCalendar)}
                >
                  <Ionicons
                    name={showCalendar ? "calendar" : "calendar-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.calendarButtonText}>
                    {showCalendar ? "Hide Calendar" : "Show Calendar"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCalendar && (
                <ProfitLossCalendar data={analyticsData} COLORS={COLORS} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

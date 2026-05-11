import { View, Text } from "react-native";
import { useMemo } from "react";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../hooks/useTheme";
import { useCurrency } from "../hooks/useCurrency";

export const BalanceCard = ({ summary }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);
  const { format } = useCurrency();

  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Total Balance</Text>
      <Text style={styles.balanceAmount}>{format(summary.balance)}</Text>
      <View style={styles.balanceStats}>
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Income</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.income }]}>
            +{format(summary.income)}
          </Text>
        </View>
        <View style={[styles.balanceStatItem, styles.statDivider]} />
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Expenses</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.expense }]}>
            -{format(Math.abs(parseFloat(summary.expenses || 0)))}
          </Text>
        </View>
      </View>
    </View>
  );
};

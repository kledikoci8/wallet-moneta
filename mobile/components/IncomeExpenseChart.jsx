import { View, Text, Dimensions } from 'react-native';
import { useMemo } from 'react';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { createAnalyticsStyles } from '../assets/styles/analytics.styles';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 220;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 35;
const PADDING_LEFT = 45;
const PADDING_RIGHT = 15;
const BAR_WIDTH = 14;
const BAR_GAP = 4;

export const IncomeExpenseChart = ({ data, COLORS: propColors }) => {
  const { COLORS: ctx } = useTheme();
  const COLORS = propColors || ctx;
  const styles = useMemo(() => createAnalyticsStyles(COLORS), [COLORS]);

  if (!data || !data.monthlyData || data.monthlyData.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const monthlyData = data.monthlyData;
  const dataLength = monthlyData.length;

  // Calculate max value for scaling
  const allValues = monthlyData.flatMap(item => [
    item.income || 0,
    Math.abs(item.expense || 0)
  ]);
  const maxValue = Math.max(...allValues, 100);

  // Round max value to nice number for Y-axis
  const niceMax = Math.ceil(maxValue / 100) * 100;

  // Chart dimensions
  const chartWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Calculate bar positions
  const groupWidth = (BAR_WIDTH * 2) + BAR_GAP;
  const totalGroupsWidth = groupWidth * dataLength;
  const spacing = (chartWidth - totalGroupsWidth) / (dataLength + 1);

  const getGroupX = (index) => {
    return PADDING_LEFT + spacing + (index * (groupWidth + spacing));
  };

  const getBarHeight = (value) => {
    return (value / niceMax) * chartHeight;
  };

  const getY = (value) => {
    return PADDING_TOP + chartHeight - getBarHeight(value);
  };

  // Y-axis labels (5 steps)
  const yAxisSteps = [0, 0.25, 0.5, 0.75, 1];

  const formatAmount = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  return (
    <View style={styles.chartContainer}>
      <View style={{ alignItems: 'center' }}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Y-axis line */}
          <Line
            x1={PADDING_LEFT}
            y1={PADDING_TOP}
            x2={PADDING_LEFT}
            y2={PADDING_TOP + chartHeight}
            stroke={COLORS.border}
            strokeWidth={1}
          />

          {/* X-axis line */}
          <Line
            x1={PADDING_LEFT}
            y1={PADDING_TOP + chartHeight}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y2={PADDING_TOP + chartHeight}
            stroke={COLORS.border}
            strokeWidth={1}
          />

          {/* Grid lines and Y-axis labels */}
          {yAxisSteps.map((ratio, i) => {
            const y = PADDING_TOP + chartHeight * (1 - ratio);
            const value = niceMax * ratio;
            return (
              <G key={`grid-${i}`}>
                <Line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={CHART_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  opacity={0.5}
                />
                <SvgText
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  fontSize={10}
                  fill={COLORS.textLight}
                  textAnchor="end"
                >
                  {formatAmount(value)}
                </SvgText>
              </G>
            );
          })}

          {/* Bars */}
          {monthlyData.map((item, index) => {
            const groupX = getGroupX(index);
            const income = item.income || 0;
            const expense = Math.abs(item.expense || 0);
            const incomeHeight = getBarHeight(income);
            const expenseHeight = getBarHeight(expense);

            return (
              <G key={`bar-group-${index}`}>
                {/* Income Bar */}
                <Rect
                  x={groupX}
                  y={getY(income)}
                  width={BAR_WIDTH}
                  height={Math.max(incomeHeight, 2)}
                  fill={COLORS.income}
                  rx={4}
                  ry={4}
                />

                {/* Expense Bar */}
                <Rect
                  x={groupX + BAR_WIDTH + BAR_GAP}
                  y={getY(expense)}
                  width={BAR_WIDTH}
                  height={Math.max(expenseHeight, 2)}
                  fill={COLORS.expense}
                  rx={4}
                  ry={4}
                />

                {/* Month Label */}
                <SvgText
                  x={groupX + BAR_WIDTH + (BAR_GAP / 2)}
                  y={CHART_HEIGHT - 10}
                  fontSize={11}
                  fontWeight="500"
                  fill={COLORS.text}
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.income, borderRadius: 4 }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.expense, borderRadius: 4 }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>
    </View>
  );
};

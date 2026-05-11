import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { createAnalyticsStyles } from '../assets/styles/analytics.styles';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MINI_CHART_WIDTH = 24;
const MINI_CHART_HEIGHT = 18;

export const ProfitLossCalendar = ({ data, COLORS: propColors }) => {
  const { COLORS: ctx } = useTheme();
  const COLORS = propColors || ctx;
  const styles = useMemo(() => createAnalyticsStyles(COLORS), [COLORS]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const getDayData = (day) => {
    if (!data || !data.dailyData) return null;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dayData = data.dailyData.find(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && 
             itemDate.getMonth() + 1 === month && 
             itemDate.getDate() === day;
    });
    return dayData;
  };

  const monthlySummary = useMemo(() => {
    if (!data || !data.dailyData) return { income: 0, expense: 0, profit: 0 };
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    data.dailyData.forEach(item => {
      const itemDate = new Date(item.date);
      if (itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month) {
        totalIncome += item.income || 0;
        totalExpense += Math.abs(item.expense) || 0;
      }
    });
    
    return {
      income: totalIncome,
      expense: totalExpense,
      profit: totalIncome - totalExpense
    };
  }, [data, currentDate]);

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDayPress = (day) => {
    const dayData = getDayData(day);
    setSelectedDay({
      day,
      month: MONTHS[currentDate.getMonth()],
      year: currentDate.getFullYear(),
      income: dayData?.income || 0,
      expense: Math.abs(dayData?.expense || 0),
    });
    setModalVisible(true);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const blanks = Array(startingDayOfWeek).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const DayMiniChart = ({ income, expense }) => {
    const maxVal = Math.max(income, expense, 1);
    const incomeHeight = (income / maxVal) * MINI_CHART_HEIGHT;
    const expenseHeight = (expense / maxVal) * MINI_CHART_HEIGHT;
    
    return (
      <Svg width={MINI_CHART_WIDTH} height={MINI_CHART_HEIGHT}>
        <Rect
          x={4}
          y={MINI_CHART_HEIGHT - incomeHeight}
          width={7}
          height={Math.max(incomeHeight, 2)}
          fill={COLORS.income}
          rx={2}
        />
        <Rect
          x={13}
          y={MINI_CHART_HEIGHT - expenseHeight}
          width={7}
          height={Math.max(expenseHeight, 2)}
          fill={COLORS.expense}
          rx={2}
        />
      </Svg>
    );
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Month Navigation */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Monthly Summary */}
      <View style={styles.monthlySummaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: COLORS.income }]}>
            +${monthlySummary.income.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
            -${monthlySummary.expense.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Profit/Loss</Text>
          <Text style={[
            styles.summaryValue, 
            { color: monthlySummary.profit >= 0 ? COLORS.income : COLORS.expense }
          ]}>
            {monthlySummary.profit >= 0 ? '+' : ''}${monthlySummary.profit.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Days Header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayHeaderText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.daysGrid}>
        {blanks.map((_, index) => (
          <View key={`blank-${index}`} style={styles.dayCell} />
        ))}
        {daysArray.map((day) => {
          const dayData = getDayData(day);
          const income = dayData?.income || 0;
          const expense = Math.abs(dayData?.expense || 0);
          const profitLoss = income - expense;
          const hasData = income !== 0 || expense !== 0;
          
          const isToday = 
            day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();

          return (
            <TouchableOpacity
              key={day}
              onPress={() => handleDayPress(day)}
              style={[
                styles.dayCell,
                styles.dayCellEnhanced,
                isToday && styles.todayCell,
                hasData && profitLoss > 0 && styles.profitCell,
                hasData && profitLoss < 0 && styles.lossCell,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.todayText,
                hasData && styles.dayTextWithData,
              ]}>
                {day}
              </Text>
              {hasData && (
                <>
                  <DayMiniChart income={income} expense={expense} />
                  <Text style={[
                    styles.amountTextSmall,
                    profitLoss >= 0 ? styles.profitText : styles.lossText,
                  ]}>
                    {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(0)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: COLORS.income }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: COLORS.expense }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay?.month} {selectedDay?.day}, {selectedDay?.year}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <View style={[styles.modalIcon, { backgroundColor: COLORS.income + '20' }]}>
                  <Ionicons name="arrow-up" size={20} color={COLORS.income} />
                </View>
                <View style={styles.modalRowText}>
                  <Text style={styles.modalLabel}>Income</Text>
                  <Text style={[styles.modalValue, { color: COLORS.income }]}>
                    +${(selectedDay?.income || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalRow}>
                <View style={[styles.modalIcon, { backgroundColor: COLORS.expense + '20' }]}>
                  <Ionicons name="arrow-down" size={20} color={COLORS.expense} />
                </View>
                <View style={styles.modalRowText}>
                  <Text style={styles.modalLabel}>Expense</Text>
                  <Text style={[styles.modalValue, { color: COLORS.expense }]}>
                    -${(selectedDay?.expense || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalDivider} />
              
              <View style={styles.modalRow}>
                <View style={[styles.modalIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="wallet" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.modalRowText}>
                  <Text style={styles.modalLabel}>Net</Text>
                  <Text style={[
                    styles.modalValue, 
                    { color: (selectedDay?.income - selectedDay?.expense) >= 0 ? COLORS.income : COLORS.expense }
                  ]}>
                    {(selectedDay?.income - selectedDay?.expense) >= 0 ? '+' : ''}
                    ${((selectedDay?.income || 0) - (selectedDay?.expense || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createAnalyticsStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,

  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 15,
  },
  
  // Chart Styles
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    gap: 4,
  },
  barWrapper: {
    width: 16,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  incomeBar: {
    backgroundColor: COLORS.income,
  },
  expenseBar: {
    backgroundColor: COLORS.expense,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.text,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 16,
    paddingVertical: 40,
  },

  // Calendar Styles
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  calendarButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthlySummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  dayHeaderText: {
    width: (width - 80) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 80) / 7,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellEnhanced: {
    minHeight: 70,
    paddingVertical: 4,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profitCell: {
    backgroundColor: COLORS.income + '30',
  },
  lossCell: {
    backgroundColor: COLORS.expense + '30',
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayTextWithData: {
    fontWeight: '700',
  },
  amountText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  amountTextSmall: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  profitText: {
    color: COLORS.income,
  },
  lossText: {
    color: COLORS.expense,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: width - 60,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    gap: 15,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRowText: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  modalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 5,
  },
});

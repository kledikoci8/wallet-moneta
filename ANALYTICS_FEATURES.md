# Analytics Features

## New Features Added

### 1. Analytics Screen
- **Location**: `mobile/app/(root)/analytics.jsx`
- **Access**: Click the chart icon in the home screen header
- **Features**:
  - Income vs Expense bar chart
  - Daily Profit/Loss calendar
  - Toggle calendar visibility with a button

### 2. Income vs Expense Chart
- **Component**: `mobile/components/IncomeExpenseChart.jsx`
- Shows last 6 months of data
- Side-by-side bars comparing income and expense
- Color-coded legend (green for income, red for expense)

### 3. Profit/Loss Calendar
- **Component**: `mobile/components/ProfitLossCalendar.jsx`
- **Features**:
  - Monthly calendar view
  - Navigate between months with arrow buttons
  - Color-coded days:
    - Green background = Profit day
    - Red background = Loss day
    - Border highlight = Today
  - Shows daily profit/loss amount on each day
  - Toggle visibility with "Show/Hide Calendar" button

### 4. Backend Analytics Endpoint
- **Endpoint**: `GET /api/transactions/analytics/:userId`
- **Returns**:
  - `dailyData`: Array of daily income/expense totals
  - `monthlyData`: Array of monthly income/expense for last 6 months

## How to Use

1. **Access Analytics**: From the home screen, tap the chart icon (📊) in the top right
2. **View Chart**: Scroll to see the income vs expense comparison chart
3. **View Calendar**: Tap "Show Calendar" button to display the profit/loss calendar
4. **Navigate Months**: Use left/right arrows to view different months
5. **Interpret Colors**:
   - Green days = You made profit
   - Red days = You had losses
   - Numbers show the exact amount

## Files Modified/Created

### Mobile (Frontend)
- ✅ `mobile/app/(root)/analytics.jsx` - New analytics screen
- ✅ `mobile/app/(root)/index.jsx` - Added analytics button
- ✅ `mobile/components/IncomeExpenseChart.jsx` - Chart component
- ✅ `mobile/components/ProfitLossCalendar.jsx` - Calendar component
- ✅ `mobile/assets/styles/analytics.styles.js` - Styling for analytics
- ✅ `mobile/assets/styles/home.styles.js` - Added analytics button style

### Backend
- ✅ `backend/config/controllers/transactionsController.js` - Added `getAnalyticsByUserId`
- ✅ `backend/routes/transactionsRoute.js` - Added analytics route

## Technical Details

- Uses native React Native components (no external chart libraries needed)
- Responsive design that adapts to screen size
- Efficient data fetching with single API call
- Calendar automatically highlights current day
- Smooth animations and transitions

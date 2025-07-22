# Cost Splitting Features - PlanMyEscape

## Overview
The shopping list now includes Splitwise-like cost splitting functionality, allowing groups to track expenses, split costs, and manage settlements for camping trips.

## Key Features

### 1. Renamed Shopping List
- ✅ Changed "Complete Shopping List" to "Shopping List" throughout the app
- Simplified naming for better UX

### 2. Individual Item Cost Splitting
- **Add Costs**: Click the calculator icon on any shopping item to add cost information
- **Split Types**: 
  - **Equal Split**: Divide cost evenly among all groups
  - **By Group Size**: Split based on number of people in each group  
  - **Custom Split**: Set specific amounts for each group
- **Payment Tracking**: Record who paid for each item
- **Receipt Management**: Optional receipt URL and notes

### 3. Expense Summary Dashboard
- **Overview Tab**: Total costs, payments, and pending amounts
- **Group Balances**: See who owes what to whom
- **Settlements Tab**: Automated settlement suggestions

### 4. Smart Settlement Calculation
- Automatic calculation of optimal settlements (minimizes number of transactions)
- Clear settlement amounts between groups
- Balance tracking (positive = owed money, negative = owes money)

## User Interface Design

### Visual Indicators
- 💵 Green dollar icon: Item has cost data
- 🧮 Calculator icon: Add/edit cost splitting
- ✅ Check icon: Mark as purchased
- 📊 Bar chart icon: View expense summary

### Color Coding
- **Blue**: Purchased items and total costs
- **Green**: Settled amounts and positive balances  
- **Orange/Red**: Pending payments and debts
- **Gray**: Neutral/inactive states

## Data Structure

### Enhanced ShoppingItem
```typescript
interface ShoppingItem {
  // Existing fields...
  cost?: number;
  currency?: string;
  paidByGroupId?: string;
  paidByUserName?: string;
  splitType?: 'equal' | 'custom' | 'by_group';
  splits?: ItemSplit[];
  receiptUrl?: string;
  purchaseDate?: string;
  notes?: string;
}
```

### New Types
- **ItemSplit**: Individual group's portion of an expense
- **ExpenseSummary**: Group's total paid vs owed amounts
- **Settlement**: Suggested payments between groups
- **ExpenseMetrics**: Overall trip expense statistics

## Workflow

### Basic Cost Splitting
1. Navigate to Shopping List
2. Click calculator icon on any item
3. Enter total cost
4. Select who paid
5. Choose split method (equal/by group/custom)
6. Save the split

### Expense Management
1. Click "Expenses" button to view summary
2. Review group balances in "Group Balances" tab
3. Check "Settlements" tab for payment suggestions
4. Mark settlements as completed when paid

### Group Collaboration
- Each group can see their portion of expenses
- Clear visibility into who paid for what
- Transparent settlement suggestions
- Receipt tracking for accountability

## Technical Implementation

### Components
- **CostSplitter**: Modal for editing item costs and splits
- **ExpenseSummary**: Dashboard for expense overview and settlements
- **ExpenseCalculator**: Utility class for split calculations

### Key Features
- Real-time balance calculations
- Optimal settlement algorithms
- Responsive design for mobile/desktop
- Integration with existing trip group system
- Local storage persistence

## Benefits

### For Trip Organizers
- Clear overview of all trip expenses
- Automated settlement calculations
- Easy expense tracking and management
- Professional receipt management

### For Group Members  
- Transparent cost sharing
- Clear understanding of individual obligations
- Easy settlement process
- Mobile-friendly expense tracking

### For Groups
- Fair cost distribution options
- Accurate group-based or per-person splitting
- Minimal settlement transactions
- Complete expense history

## Future Enhancements
- Integration with payment apps (Venmo, PayPal)
- Photo receipt uploads
- Expense categories and budgeting
- Currency conversion for international trips
- Email notifications for settlements
- Export to accounting software
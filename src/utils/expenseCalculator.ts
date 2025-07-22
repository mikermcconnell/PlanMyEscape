import { ShoppingItem, Group, ExpenseSummary, Settlement, ExpenseMetrics, ItemSplit } from '../types';

export class ExpenseCalculator {
  static calculateSplits(
    cost: number,
    splitType: 'equal' | 'custom' | 'by_group',
    groups: Group[],
    customSplits?: ItemSplit[]
  ): ItemSplit[] {
    switch (splitType) {
      case 'equal':
        const equalAmount = Math.round((cost / groups.length) * 100) / 100;
        return groups.map(group => ({
          groupId: group.id,
          groupName: group.name,
          amount: equalAmount,
          isSettled: false
        }));
      
      case 'by_group':
        const totalGroupSize = groups.reduce((sum, group) => sum + group.size, 0);
        return groups.map(group => ({
          groupId: group.id,
          groupName: group.name,
          amount: Math.round((cost * group.size / totalGroupSize) * 100) / 100,
          isSettled: false
        }));
      
      case 'custom':
        return customSplits || [];
      
      default:
        return [];
    }
  }

  static calculateExpenseSummary(
    shoppingItems: ShoppingItem[],
    groups: Group[]
  ): ExpenseSummary[] {
    const summaries = new Map<string, ExpenseSummary>();
    
    // Initialize summaries for all groups
    groups.forEach(group => {
      summaries.set(group.id, {
        groupId: group.id,
        groupName: group.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      });
    });

    // Calculate totals from shopping items
    shoppingItems.forEach(item => {
      if (!item.cost || !item.splits) return;

      // Add to paid amount for the group that paid
      if (item.paidByGroupId) {
        const paidBySummary = summaries.get(item.paidByGroupId);
        if (paidBySummary) {
          paidBySummary.totalPaid += item.cost;
        }
      }

      // Add to owed amounts for each group in the split
      item.splits.forEach(split => {
        const summary = summaries.get(split.groupId);
        if (summary) {
          summary.totalOwed += split.amount;
        }
      });
    });

    // Calculate balances
    Array.from(summaries.values()).forEach(summary => {
      summary.balance = summary.totalPaid - summary.totalOwed;
    });

    return Array.from(summaries.values());
  }

  static generateSettlements(expenseSummaries: ExpenseSummary[]): Settlement[] {
    const settlements: Settlement[] = [];
    const creditors = expenseSummaries.filter(s => s.balance > 0.01);
    const debtors = expenseSummaries.filter(s => s.balance < -0.01);
    
    // Sort by absolute balance amount (largest first)
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      if (!creditor || !debtor) break;
      
      const settleAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      if (settleAmount > 0.01) { // Only create settlement if amount is meaningful
        settlements.push({
          id: crypto.randomUUID(),
          fromGroupId: debtor.groupId,
          toGroupId: creditor.groupId,
          amount: Math.round(settleAmount * 100) / 100,
          currency: 'USD', // Default currency
          description: `Settlement from ${debtor.groupName} to ${creditor.groupName}`,
          isSettled: false,
          createdDate: new Date().toISOString()
        });

        creditor.balance -= settleAmount;
        debtor.balance += settleAmount;
      }

      // Move to next creditor/debtor if current one is settled
      if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    }

    return settlements;
  }

  static calculateExpenseMetrics(
    shoppingItems: ShoppingItem[],
    settlements: Settlement[] = []
  ): ExpenseMetrics {
    const totalCost = shoppingItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalPaid = shoppingItems.reduce((sum, item) => 
      sum + (item.cost && item.paidByGroupId ? item.cost : 0), 0
    );
    const totalPending = totalCost - totalPaid;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      currency: 'USD',
      settlements
    };
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }
}
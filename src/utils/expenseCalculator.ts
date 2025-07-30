import { ShoppingItem, Group, Settlement } from '../types';

export interface ExpenseMetrics {
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  itemsWithCosts: number;
}

export interface GroupExpenseSummary {
  groupId: string;
  groupName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

export interface EnhancedSettlement extends Settlement {
  id: string;
}

export class ExpenseCalculator {
  /**
   * Calculate overall expense metrics from shopping items
   */
  static calculateExpenseMetrics(shoppingItems: ShoppingItem[]): ExpenseMetrics {
    const itemsWithCosts = shoppingItems.filter(item => item.cost && item.cost > 0);
    
    const totalCost = itemsWithCosts.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalPaid = itemsWithCosts
      .filter(item => item.isChecked)
      .reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalPending = totalCost - totalPaid;

    return {
      totalCost,
      totalPaid,
      totalPending,
      itemsWithCosts: itemsWithCosts.length
    };
  }

  /**
   * Calculate expense summary for each group
   */
  static calculateExpenseSummary(shoppingItems: ShoppingItem[], groups: Group[]): GroupExpenseSummary[] {
    const itemsWithCosts = shoppingItems.filter(item => item.cost && item.cost > 0);
    
    return groups.map(group => {
      // Calculate how much this group paid
      const totalPaid = itemsWithCosts
        .filter(item => item.paidByGroupId === group.id)
        .reduce((sum, item) => sum + (item.cost || 0), 0);

      // Calculate how much this group owes based on splits
      const totalOwed = itemsWithCosts.reduce((sum, item) => {
        if (!item.splits || item.splits.length === 0) {
          // If no splits defined, assume equal split among all groups
          return sum + (item.cost || 0) / groups.length;
        }
        
        // Find this group's split amount
        const groupSplit = item.splits.find(split => split.groupId === group.id);
        return sum + (groupSplit?.amount || 0);
      }, 0);

      const balance = totalPaid - totalOwed;

      return {
        groupId: group.id,
        groupName: group.name,
        totalPaid,
        totalOwed,
        balance
      };
    });
  }

  /**
   * Generate settlements to balance out group expenses
   */
  static generateSettlements(expenseSummaries: GroupExpenseSummary[]): EnhancedSettlement[] {
    const settlements: EnhancedSettlement[] = [];
    
    // Separate groups that owe money from groups that are owed money
    const owesMoney = expenseSummaries
      .filter(summary => summary.balance < -0.01)
      .map(summary => ({ ...summary, balance: Math.abs(summary.balance) }))
      .sort((a, b) => b.balance - a.balance);
    
    const owedMoney = expenseSummaries
      .filter(summary => summary.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    // Create settlements by matching debts with credits
    let owedIndex = 0;
    
    for (const debtor of owesMoney) {
      let remainingDebt = debtor.balance;
      
      while (remainingDebt > 0.01 && owedIndex < owedMoney.length) {
        const creditor = owedMoney[owedIndex];
        if (!creditor) break;
        
        const settlementAmount = Math.min(remainingDebt, creditor.balance);
        
        if (settlementAmount > 0.01) {
          settlements.push({
            id: `${debtor.groupId}-${creditor.groupId}-${Date.now()}`,
            fromGroupId: debtor.groupId,
            toGroupId: creditor.groupId,
            amount: settlementAmount,
            description: `Settlement from ${debtor.groupName} to ${creditor.groupName}`,
            isSettled: false
          });
          
          remainingDebt -= settlementAmount;
          creditor.balance -= settlementAmount;
          
          if (creditor.balance <= 0.01) {
            owedIndex++;
          }
        } else {
          break;
        }
      }
    }

    return settlements;
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculate per-person split for equal division
   */
  static calculateEqualSplit(totalCost: number, numberOfGroups: number): number {
    return numberOfGroups > 0 ? totalCost / numberOfGroups : 0;
  }

  /**
   * Validate that splits add up to the total cost
   */
  static validateSplits(totalCost: number, splits: { groupId: string; amount: number }[]): boolean {
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    return Math.abs(totalSplit - totalCost) < 0.01;
  }

  /**
   * Get expense statistics for reporting
   */
  static getExpenseStatistics(shoppingItems: ShoppingItem[], groups: Group[]) {
    const metrics = this.calculateExpenseMetrics(shoppingItems);
    const summaries = this.calculateExpenseSummary(shoppingItems, groups);
    const settlements = this.generateSettlements(summaries);
    
    return {
      metrics,
      groupSummaries: summaries,
      pendingSettlements: settlements.filter(s => !s.isSettled),
      completedSettlements: settlements.filter(s => s.isSettled),
      totalGroups: groups.length,
      groupsInDebt: summaries.filter(s => s.balance < -0.01).length,
      groupsOwed: summaries.filter(s => s.balance > 0.01).length
    };
  }
}
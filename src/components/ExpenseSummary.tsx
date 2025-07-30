import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { ShoppingItem, Group, Settlement } from '../types';
import { ExpenseCalculator } from '../utils/expenseCalculator';

interface ExpenseSummaryProps {
  shoppingItems: ShoppingItem[];
  groups: Group[];
  onSettleExpense?: (settlement: Settlement) => void;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ 
  shoppingItems, 
  groups,
  onSettleExpense 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'balances' | 'settlements'>('overview');

  const metrics = useMemo(() => {
    return ExpenseCalculator.calculateExpenseMetrics(shoppingItems);
  }, [shoppingItems]);

  const expenseSummaries = useMemo(() => {
    return ExpenseCalculator.calculateExpenseSummary(shoppingItems, groups);
  }, [shoppingItems, groups]);

  const settlements = useMemo(() => {
    return ExpenseCalculator.generateSettlements(expenseSummaries);
  }, [expenseSummaries]);

  const itemsWithCosts = shoppingItems.filter(item => item.cost && item.cost > 0);

  if (itemsWithCosts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No expenses recorded yet. Add costs to shopping items to see expense tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
          Expense Summary
        </h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', count: itemsWithCosts.length },
            { id: 'balances', label: 'Group Balances', count: expenseSummaries.filter(s => Math.abs(s.balance) > 0.01).length },
            { id: 'settlements', label: 'Settlements', count: settlements.filter(s => !s.isSettled).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Cost</p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      {ExpenseCalculator.formatCurrency(metrics.totalCost)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-600 dark:text-green-400">Total Paid</p>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                      {ExpenseCalculator.formatCurrency(metrics.totalPaid)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-orange-600 dark:text-orange-400">Pending</p>
                    <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                      {ExpenseCalculator.formatCurrency(metrics.totalPending)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Expenses */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Expenses</h4>
              <div className="space-y-2">
                {itemsWithCosts.slice(0, 5).map(item => {
                  const paidByGroup = groups.find(g => g.id === item.paidByGroupId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          Paid by {paidByGroup?.name || 'Unknown'} • {item.splits && item.splits.length > 0 ? 'custom' : 'equal'} split
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {ExpenseCalculator.formatCurrency(item.cost || 0)}
                        </div>
                        {item.splits && (
                          <div className="text-xs text-gray-500">
                            Split {item.splits.length} ways
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Group Balances</h4>
            <div className="space-y-3">
              {expenseSummaries.map(summary => (
                <div key={summary.groupId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{summary.groupName}</div>
                      <div className="text-sm text-gray-500">
                        Paid: {ExpenseCalculator.formatCurrency(summary.totalPaid)} • 
                        Owes: {ExpenseCalculator.formatCurrency(summary.totalOwed)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold flex items-center ${
                      summary.balance > 0.01 
                        ? 'text-green-600' 
                        : summary.balance < -0.01 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      {summary.balance > 0.01 && <TrendingUp className="h-4 w-4 mr-1" />}
                      {summary.balance < -0.01 && <TrendingDown className="h-4 w-4 mr-1" />}
                      {ExpenseCalculator.formatCurrency(Math.abs(summary.balance))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {summary.balance > 0.01 ? 'owed to them' : 
                       summary.balance < -0.01 ? 'they owe' : 'settled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Suggested Settlements</h4>
            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">All expenses are settled!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map(settlement => (
                  <div key={settlement.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          {groups.find(g => g.id === settlement.fromGroupId)?.name}
                        </span>
                        <ArrowRight className="h-4 w-4 mx-2" />
                        <span className="font-medium">
                          {groups.find(g => g.id === settlement.toGroupId)?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {ExpenseCalculator.formatCurrency(settlement.amount)}
                        </div>
                        <div className="text-xs text-gray-500">Settlement amount</div>
                      </div>
                      {onSettleExpense && (
                        <button
                          onClick={() => onSettleExpense(settlement)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Mark Settled
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummary;
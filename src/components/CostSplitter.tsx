import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Users, Split, X, Check } from 'lucide-react';
import { ShoppingItem, Group, ItemSplit } from '../types';
import { ExpenseCalculator } from '../utils/expenseCalculator';

interface CostSplitterProps {
  item: ShoppingItem;
  groups: Group[];
  onSave: (updatedItem: ShoppingItem) => void;
  onCancel: () => void;
}

const CostSplitter: React.FC<CostSplitterProps> = ({ item, groups, onSave, onCancel }) => {
  const [cost, setCost] = useState(item.cost?.toString() || '');
  const [paidByGroupId, setPaidByGroupId] = useState(item.paidByGroupId || '');
  const [paidByUserName, setPaidByUserName] = useState(item.paidByUserName || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'by_group'>(item.splitType || 'equal');
  const [customSplits, setCustomSplits] = useState<ItemSplit[]>(item.splits || []);
  const [receiptUrl, setReceiptUrl] = useState(item.receiptUrl || '');
  const [notes, setNotes] = useState(item.notes || '');

  useEffect(() => {
    if (splitType !== 'custom' && cost && parseFloat(cost) > 0) {
      const calculatedSplits = ExpenseCalculator.calculateSplits(
        parseFloat(cost),
        splitType,
        groups
      );
      setCustomSplits(calculatedSplits);
    }
  }, [cost, splitType, groups]);

  const handleCustomSplitChange = (groupId: string, amount: string) => {
    const updatedSplits = customSplits.map(split =>
      split.groupId === groupId
        ? { ...split, amount: parseFloat(amount) || 0 }
        : split
    );
    setCustomSplits(updatedSplits);
  };

  const getTotalSplit = () => {
    return customSplits.reduce((sum, split) => sum + split.amount, 0);
  };

  const isValidSplit = () => {
    const costValue = parseFloat(cost) || 0;
    const totalSplit = getTotalSplit();
    return Math.abs(costValue - totalSplit) < 0.01;
  };

  const handleSave = () => {
    if (!isValidSplit()) return;

    const updatedItem: ShoppingItem = {
      ...item,
      cost: parseFloat(cost) || 0,
      currency: 'USD',
      paidByGroupId,
      paidByUserName: paidByUserName.trim() || undefined,
      splitType,
      splits: customSplits.length > 0 ? customSplits : undefined,
      receiptUrl: receiptUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      purchaseDate: new Date().toISOString()
    };

    onSave(updatedItem);
  };

  const costValue = parseFloat(cost) || 0;
  const totalSplit = getTotalSplit();
  const difference = costValue - totalSplit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Calculator className="h-6 w-6 mr-2 text-green-600" />
            Split Cost: {item.name}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Cost Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Total Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 text-lg font-mono"
              />
            </div>

            {/* Who Paid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paid by Group
                </label>
                <select
                  value={paidByGroupId}
                  onChange={(e) => setPaidByGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                >
                  <option value="">Select group...</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.size} people)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Person Name (Optional)
                </label>
                <input
                  type="text"
                  value={paidByUserName}
                  onChange={(e) => setPaidByUserName(e.target.value)}
                  placeholder="Who specifically paid?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Split Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Split className="h-4 w-4 inline mr-1" />
                How to Split
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setSplitType('equal')}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    splitType === 'equal'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">Equal Split</div>
                  <div className="text-xs text-gray-500">Split evenly among all groups</div>
                </button>
                <button
                  onClick={() => setSplitType('by_group')}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    splitType === 'by_group'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">By Group Size</div>
                  <div className="text-xs text-gray-500">Split based on number of people</div>
                </button>
                <button
                  onClick={() => setSplitType('custom')}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    splitType === 'custom'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">Custom</div>
                  <div className="text-xs text-gray-500">Set custom amounts</div>
                </button>
              </div>
            </div>

            {/* Split Breakdown */}
            {costValue > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Split Breakdown
                </h3>
                <div className="space-y-3">
                  {customSplits.map(split => (
                    <div key={split.groupId} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {split.groupName}
                      </span>
                      {splitType === 'custom' ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={split.amount.toString()}
                          onChange={(e) => handleCustomSplitChange(split.groupId, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 font-mono"
                        />
                      ) : (
                        <span className="font-mono text-sm">
                          ${split.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* Split Total & Validation */}
                  <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Total Split:</span>
                      <span className={`font-mono ${
                        isValidSplit() ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${totalSplit.toFixed(2)}
                      </span>
                    </div>
                    {!isValidSplit() && (
                      <div className="text-xs text-red-600 mt-1">
                        Difference: ${Math.abs(difference).toFixed(2)} 
                        {difference > 0 ? ' remaining' : ' over'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Receipt & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receipt URL (Optional)
                </label>
                <input
                  type="url"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Store, payment method, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!costValue || !paidByGroupId || !isValidSplit()}
            className={`px-4 py-2 rounded-md flex items-center ${
              costValue && paidByGroupId && isValidSplit()
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check className="h-4 w-4 mr-2" />
            Save Split
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostSplitter;
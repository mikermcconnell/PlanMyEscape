import React, { useState } from 'react';
import { X, DollarSign, Users, Plus, Minus } from 'lucide-react';
import { ShoppingItem, Group, CostSplit } from '../types';

interface CostSplitterProps {
  item: ShoppingItem;
  groups: Group[];
  onSave: (updatedItem: ShoppingItem) => void;
  onCancel: () => void;
}

const CostSplitter: React.FC<CostSplitterProps> = ({ item, groups, onSave, onCancel }) => {
  const [cost, setCost] = useState(item.cost || 0);
  const [paidByGroupId, setPaidByGroupId] = useState(item.paidByGroupId || '');
  const [paidByUserName, setPaidByUserName] = useState(item.paidByUserName || '');
  const [splits, setSplits] = useState<CostSplit[]>(
    item.splits || groups.map(group => ({ groupId: group.id, amount: 0 }))
  );
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  const handleSplitEqual = () => {
    const equalAmount = cost / groups.length;
    setSplits(groups.map(group => ({ groupId: group.id, amount: equalAmount })));
  };

  const handleSplitUpdate = (groupId: string, amount: number) => {
    setSplits(prev => prev.map(split => 
      split.groupId === groupId ? { ...split, amount } : split
    ));
  };

  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);

  const handleSave = () => {
    const updatedItem: ShoppingItem = {
      ...item,
      cost,
      paidByGroupId,
      paidByUserName,
      splits: splits.filter(split => split.amount > 0)
    };
    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Split Cost: {item.name}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Total Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Cost
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paid By Group
            </label>
            <select
              value={paidByGroupId}
              onChange={(e) => setPaidByGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paid By User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paid By Person (Optional)
            </label>
            <input
              type="text"
              value={paidByUserName}
              onChange={(e) => setPaidByUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Person's name"
            />
          </div>

          {/* Split Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Split Method
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSplitMode('equal');
                  handleSplitEqual();
                }}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  splitMode === 'equal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Equal Split
              </button>
              <button
                onClick={() => setSplitMode('custom')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  splitMode === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Custom Split
              </button>
            </div>
          </div>

          {/* Split Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How much each group owes
            </label>
            <div className="space-y-2">
              {groups.map(group => {
                const split = splits.find(s => s.groupId === group.id);
                return (
                  <div key={group.id} className="flex items-center space-x-2">
                    <div className="flex-1 flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {group.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {splitMode === 'custom' && (
                        <>
                          <button
                            onClick={() => handleSplitUpdate(group.id, Math.max(0, (split?.amount || 0) - 1))}
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          type="number"
                          value={split?.amount?.toFixed(2) || '0.00'}
                          onChange={(e) => handleSplitUpdate(group.id, parseFloat(e.target.value) || 0)}
                          className="w-20 pl-6 pr-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          step="0.01"
                          min="0"
                          disabled={splitMode === 'equal'}
                        />
                      </div>
                      {splitMode === 'custom' && (
                        <button
                          onClick={() => handleSplitUpdate(group.id, (split?.amount || 0) + 1)}
                          className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split Summary */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Split:</span>
                <span className={`font-medium ${
                  Math.abs(totalSplit - cost) < 0.01 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${totalSplit.toFixed(2)}
                </span>
              </div>
              {Math.abs(totalSplit - cost) >= 0.01 && (
                <div className="text-xs text-red-600 mt-1">
                  Difference: ${Math.abs(totalSplit - cost).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSave}
              disabled={Math.abs(totalSplit - cost) >= 0.01}
              className={`flex-1 px-4 py-2 rounded-md font-medium ${
                Math.abs(totalSplit - cost) < 0.01
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Split
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostSplitter;
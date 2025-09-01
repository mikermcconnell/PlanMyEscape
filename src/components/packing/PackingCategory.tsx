import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { PackingItem, Group } from '../../types';
import { PackingItemRow } from './PackingItemRow';

interface PackingCategoryProps {
  category: string;
  items: PackingItem[];
  groups: Group[];
  isCoordinated: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddItem: (category: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<PackingItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onEditName: (itemId: string, newName: string) => void;
  onEditNotes: (itemId: string, notes: string) => void;
}

export const PackingCategory: React.FC<PackingCategoryProps> = ({
  category,
  items,
  groups,
  isCoordinated,
  isExpanded,
  onToggleExpand,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onEditName,
  onEditNotes
}) => {
  const ownedCount = items.filter(item => item.isOwned).length;
  const packedCount = items.filter(item => item.isPacked).length;
  const needToBuyCount = items.filter(item => item.needsToBuy).length;

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {category}
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({items.length} items)
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            {ownedCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {ownedCount} owned
              </span>
            )}
            {packedCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                {packedCount} packed
              </span>
            )}
            {needToBuyCount > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                {needToBuyCount} to buy
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItem(category);
            }}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title={`Add item to ${category}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No items in this category yet.</p>
              <button
                onClick={() => onAddItem(category)}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Add your first item
              </button>
            </div>
          ) : (
            items.map(item => (
              <PackingItemRow
                key={item.id}
                item={item}
                groups={groups}
                isCoordinated={isCoordinated}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onEditName={onEditName}
                onEditNotes={onEditNotes}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
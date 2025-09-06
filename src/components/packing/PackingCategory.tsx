import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { PackingItem, Group } from '../../types';
import { PackingItemRow } from './PackingItemRow';
import { PackingListService } from '../../services/packingListService';

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
  groupAssignmentMode?: boolean;
  selectedItems?: Set<string>;
  onToggleItemSelection?: (itemId: string) => void;
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
  onEditNotes,
  groupAssignmentMode = false,
  selectedItems = new Set(),
  onToggleItemSelection = () => {}
}) => {
  // Apply intelligent sorting to items
  const sortedItems = useMemo(() => 
    PackingListService.sortItemsIntelligently(items), 
    [items]
  );

  const ownedCount = sortedItems.filter(item => item.isOwned).length;
  const packedCount = sortedItems.filter(item => item.isPacked).length;
  const needToBuyCount = sortedItems.filter(item => item.needsToBuy).length;

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
            {category}
          </h3>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 px-2 py-1 rounded-full">
            {sortedItems.length} items
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            {needToBuyCount > 0 && (
              <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                🛒 {needToBuyCount} to buy
              </span>
            )}
            {ownedCount > 0 && (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                ✓ {ownedCount} owned
              </span>
            )}
            {packedCount > 0 && (
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                ✓ {packedCount} packed
              </span>
            )}
          </div>
          
          {!groupAssignmentMode && (
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
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No items in this category yet.</p>
              <button
                onClick={() => onAddItem(category)}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Add your first item
              </button>
            </div>
          ) : groupAssignmentMode ? (
            // Simplified checkbox view for group assignment mode
            sortedItems.map(item => {
              const isSelected = selectedItems.has(item.id);
              const assignedGroup = groups.find(g => g.id === item.assignedGroupId);
              
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-purple-50 border-purple-400' 
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => onToggleItemSelection(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleItemSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          item.isPacked 
                            ? 'line-through text-gray-500' 
                            : isSelected 
                              ? 'text-purple-800' 
                              : 'text-gray-800'
                        }`}>
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-sm text-gray-500">×{item.quantity}</span>
                        )}
                      </div>
                      
                      {assignedGroup && (
                        <div className="mt-1">
                          <span 
                            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: `${assignedGroup.color}20`,
                              color: assignedGroup.color,
                              border: `1px solid ${assignedGroup.color}`
                            }}
                          >
                            {assignedGroup.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {item.needsToBuy && (
                        <span className="p-1 bg-orange-100 text-orange-600 rounded" title="Need to buy">
                          🛒
                        </span>
                      )}
                      {item.isOwned && (
                        <span className="p-1 bg-green-100 text-green-600 rounded" title="Owned">
                          ✓
                        </span>
                      )}
                      {item.isPacked && (
                        <span className="p-1 bg-blue-100 text-blue-600 rounded" title="Packed">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Normal view with separated packed and unpacked sections
            <>
              {(() => {
                const unpackedItems = sortedItems.filter(item => !item.isPacked);
                const packedItems = sortedItems.filter(item => item.isPacked);
                
                return (
                  <>
                    {/* Unpacked Items Section */}
                    {unpackedItems.length > 0 && (
                      <div className="space-y-3">
                        {unpackedItems.map(item => (
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
                        ))}
                      </div>
                    )}
                    
                    {/* Packed Items Section */}
                    {packedItems.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                            📦 Packed Items
                          </h4>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                            {packedItems.length} {packedItems.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {packedItems.map(item => (
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
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};
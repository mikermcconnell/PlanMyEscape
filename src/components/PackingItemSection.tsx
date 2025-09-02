import React from 'react';
import { PackingItem, Trip } from '../types';
import { Plus, Users, Package, ShoppingCart, CheckCircle, Check, Edit3, StickyNote, Trash2, X } from 'lucide-react';

interface PackingItemSectionProps {
  sectionType: 'personal' | 'group';
  items: PackingItem[];
  categories: string[];
  groupedItems: { [key: string]: PackingItem[] };
  trip: Trip;
  selectedGroupId: string;
  editingItem: string | null;
  editingNotes: string | null;
  notesText: string;
  onOpenAddItemModal: (category: string, assignedGroupId?: string, isPersonal?: boolean) => void;
  onToggleNeedsToBuy: (itemId: string) => void;
  onToggleOwned: (itemId: string) => void;
  onTogglePacked: (itemId: string) => void;
  onSetEditingItem: (itemId: string | null) => void;
  onUpdateItem: (itemId: string, updates: Partial<PackingItem>) => void;
  onUpdateItemQuantity: (itemId: string, quantity: number) => void;
  onStartEditingNotes: (itemId: string, currentNotes?: string) => void;
  onSetNotesText: (text: string) => void;
  onSaveNotes: (itemId: string) => void;
  onCancelEditingNotes: () => void;
  onDeleteItem: (itemId: string) => void;
  onToggleGroupAssignment: (itemId: string, groupId: string | null) => void;
  getCategoryIcon: (category: string) => React.ReactNode;
}

export const PackingItemSection: React.FC<PackingItemSectionProps> = ({
  sectionType,
  items,
  categories,
  groupedItems,
  trip,
  selectedGroupId,
  editingItem,
  editingNotes,
  notesText,
  onOpenAddItemModal,
  onToggleNeedsToBuy,
  onToggleOwned,
  onTogglePacked,
  onSetEditingItem,
  onUpdateItem,
  onUpdateItemQuantity,
  onStartEditingNotes,
  onSetNotesText,
  onSaveNotes,
  onCancelEditingNotes,
  onDeleteItem,
  onToggleGroupAssignment,
  getCategoryIcon
}) => {
  if (items.length === 0) return null;

  const sectionConfig = {
    personal: {
      title: 'Personal Items (Per Person)',
      description: 'Each person in your group needs their own',
      icon: <Users className="h-5 w-5 mr-2" />,
      headerColor: 'text-blue-600 dark:text-blue-400',
      keyPrefix: 'personal'
    },
    group: {
      title: 'Group Items (Shared by Everyone)', 
      description: 'Your group only needs one of each of these items',
      icon: <Package className="h-5 w-5 mr-2" />,
      headerColor: 'text-green-600 dark:text-green-400',
      keyPrefix: 'group'
    }
  };

  const config = sectionConfig[sectionType];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
        <h2 className={`text-xl font-bold ${config.headerColor} flex items-center`}>
          {config.icon}
          {config.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {config.description}
        </p>
      </div>
      
      {categories.map(category => {
        const categoryItems: PackingItem[] = groupedItems[category] ?? [];
        if (categoryItems.length === 0) return null;

        return (
          <div key={`${config.keyPrefix}-${category}`} className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category}</span>
                </h3>
                <button
                  onClick={() => onOpenAddItemModal(category, selectedGroupId !== 'all' ? selectedGroupId : undefined, sectionType === 'personal')}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categoryItems.map((item: PackingItem) => (
                <div key={item.id} className="px-3 sm:px-6 py-4">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="space-y-3">
                      {/* Top row: Status buttons first, then item name */}
                      <div className="flex items-center space-x-2">
                        {/* Status Buttons - positioned at the beginning */}
                        <div className="flex items-center space-x-1 mr-2">
                          {!item.isOwned && (
                            <button
                              onClick={() => onToggleNeedsToBuy(item.id)}
                              className={`p-1 rounded-full transition-colors ${
                                item.needsToBuy 
                                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                              }`}
                              title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onToggleOwned(item.id)}
                            className={`p-1 rounded-full transition-colors ${
                              item.isOwned 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                            title={item.isOwned ? "You own this item" : "Mark as owned"}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onTogglePacked(item.id)}
                            className={`p-1 rounded-full transition-colors ${
                              item.isPacked 
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                            title={item.isPacked ? "Item is packed" : "Mark as packed"}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Item name and details - now comes after status buttons */}
                        {editingItem === item.id ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                            />
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => onUpdateItemQuantity(item.id, parseInt(e.target.value))}
                              className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                            />
                            <button
                              onClick={() => onSetEditingItem(null)}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => onSetEditingItem(item.id)}
                            className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`${
                                  item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                } text-sm break-words`}>
                                  {item.name}
                                </span>
                              </div>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500 ml-2">×{item.quantity}</span>
                              )}
                              {item.weight && (
                                <span className="text-xs text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Edit, Notes, and Delete buttons */}
                        {editingItem !== item.id && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onSetEditingItem(item.id)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartEditingNotes(item.id, item.notes);
                              }}
                              className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                            >
                              <StickyNote className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.id);
                              }}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Notes editing section */}
                      {editingNotes === item.id && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <StickyNote className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                          </div>
                          <textarea
                            value={notesText}
                            onChange={(e) => onSetNotesText(e.target.value)}
                            placeholder="Add notes about this item..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onSaveNotes(item.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={onCancelEditingNotes}
                              className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notes display section */}
                      {item.notes && editingNotes !== item.id && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-center justify-between">
                      {/* Status Buttons - moved to the very beginning */}
                      <div className="flex items-center space-x-2 mr-3">
                        {!item.isOwned && (
                          <button
                            onClick={() => onToggleNeedsToBuy(item.id)}
                            className={`p-1 rounded-full transition-colors ${
                              item.needsToBuy 
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                            title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleOwned(item.id)}
                          className={`p-1 rounded-full transition-colors ${
                            item.isOwned 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                          }`}
                          title={item.isOwned ? "You own this item" : "Mark as owned"}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onTogglePacked(item.id)}
                          className={`p-1 rounded-full transition-colors ${
                            item.isPacked 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                          }`}
                          title={item.isPacked ? "Item is packed" : "Mark as packed"}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Item Details - now comes after status buttons */}
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Item Details */}
                        {editingItem === item.id ? (
                          <div className="flex items-center space-x-2 flex-1 max-w-xl">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                              style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                            />
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => onUpdateItemQuantity(item.id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                            />
                            <button
                              onClick={() => onSetEditingItem(null)}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 flex-1 max-w-xl">
                            <div 
                              onClick={() => onSetEditingItem(item.id)}
                              className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center"
                            >
                              <span className={`${
                                item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                              } break-words max-w-[300px]`}>
                                {item.name}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                              )}
                              {item.weight && (
                                <span className="text-sm text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                              )}
                            </div>
                            {/* Group Assignment */}
                            {trip.isCoordinated && (
                              <div className="flex items-center space-x-2 text-sm ml-2">
                                {/* Shared checkbox */}
                                <label className="flex items-center space-x-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !item.assignedGroupIds || 
                                      item.assignedGroupIds.length === 0 || 
                                      (item.assignedGroupIds.length === trip.groups.length && 
                                       trip.groups.every(g => item.assignedGroupIds?.includes(g.id)))
                                    }
                                    onChange={() => onToggleGroupAssignment(item.id, null)}
                                    className="rounded border-gray-300 dark:border-gray-600"
                                  />
                                  <span className="text-gray-600 dark:text-gray-400">Shared</span>
                                </label>
                                
                                {/* Individual group checkboxes */}
                                {trip.groups.map(group => (
                                  <label 
                                    key={group.id} 
                                    className="flex items-center space-x-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.assignedGroupIds?.includes(group.id) || false}
                                      onChange={() => onToggleGroupAssignment(item.id, group.id)}
                                      className="rounded border-gray-300 dark:border-gray-600"
                                      style={{ accentColor: group.color }}
                                    />
                                    <span style={{ color: group.color }}>{group.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons - stay on the far right */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEditingNotes(item.id, item.notes);
                          }}
                          className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Notes editing section for desktop */}
                    {editingNotes === item.id && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                        </div>
                        <textarea
                          value={notesText}
                          onChange={(e) => onSetNotesText(e.target.value)}
                          placeholder="Add notes about this item..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onSaveNotes(item.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={onCancelEditingNotes}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Notes display section for desktop */}
                    {item.notes && editingNotes !== item.id && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
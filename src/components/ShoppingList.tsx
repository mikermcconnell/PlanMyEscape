import React, { useState, useEffect } from 'react';
import { ShoppingCart, Utensils, Package, Check, CheckCircle, Trash2, Plus, RotateCcw, X } from 'lucide-react';
import { ShoppingItem, Group } from '../types';
import { getShoppingList, saveShoppingList } from '../utils/storage';

interface ShoppingListProps {
  tripId: string;
  groups?: Group[];
  onClose: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ tripId, groups = [], onClose }) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'camping' as 'food' | 'camping', quantity: 1 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      const items = await getShoppingList(tripId);
      setShoppingItems(items);
    };
    loadItems();
  }, [tripId]);

  const handleToggleItem = async (itemId: string) => {
    const updatedItems = shoppingItems.map(item => 
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    );
    setShoppingItems(updatedItems);
    await saveShoppingList(tripId, updatedItems);
  };

  const handleToggleNeedsToBuy = async (itemId: string) => {
    const updatedItems = shoppingItems.map(item => 
      item.id === itemId ? { ...item, needsToBuy: !item.needsToBuy, isOwned: false } : item
    );
    setShoppingItems(updatedItems);
    await saveShoppingList(tripId, updatedItems);
  };

  const handleToggleOwned = async (itemId: string) => {
    const updatedItems = shoppingItems.map(item => 
      item.id === itemId ? { ...item, isOwned: !item.isOwned, needsToBuy: false } : item
    );
    setShoppingItems(updatedItems);
    await saveShoppingList(tripId, updatedItems);
  };

  const handleRemoveItem = async (itemId: string) => {
    const updatedItems = shoppingItems.filter(item => item.id !== itemId);
    setShoppingItems(updatedItems);
    await saveShoppingList(tripId, updatedItems);
  };


  const handleAddItem = async () => {
    if (newItem.name.trim()) {
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        category: newItem.category,
        isChecked: false,
        needsToBuy: false,
        isOwned: false
      };
      
      const updatedItems = [...shoppingItems, item];
      setShoppingItems(updatedItems);
      await saveShoppingList(tripId, updatedItems);
      setNewItem({ name: '', category: 'camping', quantity: 1 });
      setShowAddForm(false);
    }
  };

  const clearUserInput = async () => {
    // This should reset the needsToBuy flags in the source lists (packing and meals)
    // and clear all manually added items
    
    // Step 1: Get current packing list and reset needsToBuy flags
    const { getPackingList, savePackingList } = await import('../utils/storage');
    const packingItems = await getPackingList(tripId);
    const resetPackingItems = packingItems.map(item => ({
      ...item,
      needsToBuy: false // Reset all packing items
    }));
    await savePackingList(tripId, resetPackingItems);
    
    // Step 2: Clear all shopping items (both manual and auto-generated)
    // The shopping list should regenerate from the reset sources
    setShoppingItems([]);
    await saveShoppingList(tripId, []);
    
    setShowClearConfirmation(false);
  };

  const foodItems = shoppingItems.filter(item => item.category === 'food');
  const campingItems = shoppingItems.filter(item => item.category === 'camping');

  const renderItemList = (items: ShoppingItem[], title: string, icon: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center mb-3">
        {icon}
        <span className="ml-2">{title}</span>
        <span className="ml-2 text-sm text-gray-500">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          No {title.toLowerCase()} items
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {/* Status Buttons */}
              <div className="flex items-center space-x-2 mr-3">
                {/* Checked / packed */}
              <button
                onClick={() => handleToggleItem(item.id)}
                  className={`p-1 rounded-full transition-colors ${
                  item.isChecked 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
                  title={item.isChecked ? 'Purchased / Packed' : 'Mark as purchased'}
              >
                <Check className="h-4 w-4" />
              </button>
                {/* Need to buy */}
                <button
                  onClick={() => handleToggleNeedsToBuy(item.id)}
                  className={`p-1 rounded-full transition-colors ${
                    item.needsToBuy 
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                  title={item.needsToBuy ? 'Need to buy' : 'Mark as need to buy'}
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
                {/* Owned */}
                <button
                  onClick={() => handleToggleOwned(item.id)}
                  className={`p-1 rounded-full transition-colors ${
                    item.isOwned 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                  title={item.isOwned ? 'Owned' : 'Mark as owned'}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <div className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ml-2 text-sm text-gray-500">×{item.quantity}</span>
                  )}
                </div>
              </div>
              {/* Status Badges */}
              {item.isOwned && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Owned
                </span>
              )}
              {item.needsToBuy && !item.isOwned && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 mr-2">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Need to Buy
                </span>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ShoppingCart className="h-6 w-6 mr-2" />
            Shopping List
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear List
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add Item Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as 'food' | 'camping' }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                >
                  <option value="camping">Camping</option>
                  <option value="food">Food</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Item Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </button>
          )}

          {/* Legend */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Icons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center">
                <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mr-2">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Purchased/Packed</span>
              </div>
              <div className="flex items-center">
                <div className="p-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 mr-2">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Need to Buy</span>
              </div>
              <div className="flex items-center">
                <div className="p-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mr-2">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Owned</span>
              </div>
            </div>
          </div>

          {/* Food Items */}
          {renderItemList(foodItems, 'Food Items', <Utensils className="h-5 w-5" />)}

          {/* Camping Items */}
          {renderItemList(campingItems, 'Camping Items', <Package className="h-5 w-5" />)}

          {/* Summary */}
          {shoppingItems.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div>Total items: {shoppingItems.length}</div>
                <div>Checked: {shoppingItems.filter(item => item.isChecked).length}</div>
                <div>Remaining: {shoppingItems.filter(item => !item.isChecked).length}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clear Shopping List
              </h3>
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will clear the entire shopping list and reset all "need to buy" flags in your packing and meal lists. This means nothing will be marked as needing to be purchased.
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={clearUserInput}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Clear List
                </button>
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList; 
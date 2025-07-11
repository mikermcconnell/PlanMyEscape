import React, { useState, useEffect } from 'react';
import { ShoppingCart, Utensils, Package, Check, Trash2, Plus } from 'lucide-react';
import { ShoppingItem } from '../types';
import { getShoppingList, saveShoppingList } from '../utils/storage';

interface ShoppingListProps {
  tripId: string;
  onClose: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ tripId, onClose }) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'camping' as 'food' | 'camping', quantity: 1 });
  const [showAddForm, setShowAddForm] = useState(false);

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
        isChecked: false
      };
      
      const updatedItems = [...shoppingItems, item];
      setShoppingItems(updatedItems);
      await saveShoppingList(tripId, updatedItems);
      setNewItem({ name: '', category: 'camping', quantity: 1 });
      setShowAddForm(false);
    }
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
              <button
                onClick={() => handleToggleItem(item.id)}
                className={`p-1 rounded-full transition-colors mr-3 ${
                  item.isChecked 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                <Check className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <span className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {item.name}
                </span>
                {item.quantity > 1 && (
                  <span className="ml-2 text-sm text-gray-500">×{item.quantity}</span>
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
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
    </div>
  );
};

export default ShoppingList; 
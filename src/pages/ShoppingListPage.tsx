import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShoppingCart, FileDown, Check, RotateCcw, X } from 'lucide-react';
import { Trip, ShoppingItem } from '../types';
import { hybridDataService } from '../services/hybridDataService';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const ShoppingListPage: React.FC = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  useEffect(() => {
    const load = async () => {
      console.log(`📥 [ShoppingListPage] Loading shopping items for trip ${tripId}...`);
      const list = await hybridDataService.getShoppingItems(tripId);
      console.log(`📊 [ShoppingListPage] Loaded ${list.length} shopping items`);
      setAllItems(list);
    };
    load();
  }, [tripId]);

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Shopping List', 14, 20);

    doc.setFontSize(12);
    let y = 30;
    const needToBuy = allItems.filter(i => i.needsToBuy);

    needToBuy.forEach(item => {
      const line = `${item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}`;
      doc.rect(14, y - 4, 6, 6); // empty checkbox
      doc.text(line, 22, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('shopping-list.pdf');
  };

  const toggleBought = async (itemId: string) => {
    const updated = allItems.map(it => it.id === itemId ? { ...it, isChecked: !it.isChecked } : it);
    setAllItems(updated);
    await hybridDataService.saveShoppingItems(tripId, updated);

    // Force refresh from storage to ensure UI is in sync
    const refreshed = await hybridDataService.getShoppingItems(tripId);
    setAllItems(refreshed);

    const toggled = updated.find(i => i.id === itemId);
    if (toggled?.isChecked) {
      toast.success(`Great! You bought ${toggled.name}.`, { autoClose: 2000 });
    }
  };


  const clearUserInput = async () => {
    // This should reset the needsToBuy flags in the source lists (packing and meals)
    // and clear all manually added items
    console.log(`🧹 [ShoppingListPage] Clearing shopping list for trip ${tripId}...`);
    
    // Step 1: Get current packing list and reset needsToBuy flags
    const packingItems = await hybridDataService.getPackingItems(tripId);
    const resetPackingItems = packingItems.map(item => ({
      ...item,
      needsToBuy: false // Reset all packing items
    }));
    await hybridDataService.savePackingItems(tripId, resetPackingItems);
    console.log(`🧹 [ShoppingListPage] Reset ${resetPackingItems.length} packing items needsToBuy flags`);
    
    // Step 2: Clear all shopping items (both manual and auto-generated)
    // The shopping list should regenerate from the reset sources
    setAllItems([]);
    await hybridDataService.saveShoppingItems(tripId, []);
    console.log(`🧹 [ShoppingListPage] Cleared all shopping items`);
    
    setShowClearConfirmation(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Shopping List
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automatically combines items from your packing list and meal planner that need to be purchased.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowClearConfirmation(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear List
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {(() => {
        const needToBuy = allItems.filter(i => i.needsToBuy);
        const total = needToBuy.length;
        const bought = needToBuy.filter(i => i.isChecked).length;
        const remaining = total - bought;
        return (
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6 max-w-md">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{bought}/{total}</div>
              <div className="text-sm text-gray-500">Bought</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{remaining}</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        );
      })()}


      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-w-md">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Icons</h3>
        <div className="flex items-center">
          <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mr-2">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 text-sm">Purchased</span>
        </div>
      </div>

      {/* Shopping List Items */}
      {allItems.filter(i => i.needsToBuy).length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No items marked as need to buy.</div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {(() => {
            const itemsToBuy = allItems.filter(i => i.needsToBuy);
            
            // Sort items: unpurchased first, then purchased (moved to bottom)
            // Within each group, sort by category (packing items first, then ingredients)
            const sortedItems = itemsToBuy.sort((a, b) => {
              // First sort by purchase status (unpurchased first)
              if (a.isChecked !== b.isChecked) {
                return a.isChecked ? 1 : -1;
              }
              
              // Then sort by category (camping/packing first, then food/ingredients)
              if (a.category !== b.category) {
                return a.category === 'camping' ? -1 : 1;
              }
              
              // Finally sort by name
              return a.name.localeCompare(b.name);
            });
            
            // Group items by category for display
            const packingItems = sortedItems.filter(item => item.category === 'camping');
            const ingredientItems = sortedItems.filter(item => item.category === 'food');
            
            const renderItem = (item: ShoppingItem) => {
              return (
                <div key={item.id} className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleBought(item.id)}
                    className={`p-1 rounded-full transition-colors mr-3 ${
                      item.isChecked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                    title={item.isChecked ? 'Purchased' : 'Mark as purchased'}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1">
                    <div className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {item.name}{item.quantity > 1 && <span className="ml-1 text-sm text-gray-500">×{item.quantity}</span>}
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <>
                {/* Packing Items Section */}
                {packingItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      🎒 Packing Items
                    </h3>
                    <div className="space-y-2">
                      {packingItems.map(renderItem)}
                    </div>
                  </div>
                )}

                {/* Ingredients Section */}
                {ingredientItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      🍽️ Meal Ingredients
                    </h3>
                    <div className="space-y-2">
                      {ingredientItems.map(renderItem)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      
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
      
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ShoppingListPage; 
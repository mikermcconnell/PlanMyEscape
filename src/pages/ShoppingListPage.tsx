import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShoppingCart, FileDown, Check, RotateCcw, X, Users } from 'lucide-react';
import { Trip, ShoppingItem, Group } from '../types';
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
  const [groupByAssignment, setGroupByAssignment] = useState(false);

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

  const exportGroupPDF = (group: Group) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Shopping List - ${group.name}`, 14, 20);

    doc.setFontSize(10);
    doc.text(`${group.size} people`, 14, 28);

    doc.setFontSize(12);
    let y = 40;
    
    // Get items assigned to this group or shared items (no group assignment)
    const groupItems = allItems.filter(i => 
      i.needsToBuy && (i.assignedGroupId === group.id || !i.assignedGroupId)
    );

    if (groupItems.length === 0) {
      doc.text('No items assigned to this group.', 14, y);
    } else {
      groupItems.forEach(item => {
        const line = `${item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}`;
        doc.rect(14, y - 4, 6, 6); // empty checkbox
        doc.text(line, 22, y);
        y += 10;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save(`shopping-list-${group.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const exportAllGroupPDFs = () => {
    // Export a shopping list for each group
    trip.groups.forEach(group => {
      setTimeout(() => exportGroupPDF(group), 100); // Small delay to prevent browser download blocking
    });
    
    // Also export the shared items (All Groups) list if there are any
    const sharedItems = allItems.filter(i => i.needsToBuy && !i.assignedGroupId);
    if (sharedItems.length > 0) {
      setTimeout(() => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Shopping List - Shared Items', 14, 20);
        
        doc.setFontSize(12);
        let y = 30;
        
        sharedItems.forEach(item => {
          const line = `${item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}`;
          doc.rect(14, y - 4, 6, 6);
          doc.text(line, 22, y);
          y += 10;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        
        doc.save('shopping-list-shared-items.pdf');
      }, trip.groups.length * 100 + 100);
    }
    
    toast.success(`Generating ${trip.groups.length}${sharedItems.length > 0 ? ' + shared items' : ''} shopping lists...`, { autoClose: 3000 });
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

  const updateItemGroup = async (itemId: string, groupId: string | undefined) => {
    const updated = allItems.map(it => 
      it.id === itemId ? { ...it, assignedGroupId: groupId } : it
    );
    setAllItems(updated);
    await hybridDataService.saveShoppingItems(tripId, updated);

    // Force refresh from storage to ensure UI is in sync
    const refreshed = await hybridDataService.getShoppingItems(tripId);
    setAllItems(refreshed);
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
            onClick={() => setGroupByAssignment(!groupByAssignment)}
            className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
              groupByAssignment 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
            }`}
            title={groupByAssignment ? 'Show as list' : 'Group by assignment'}
          >
            <Users className="h-4 w-4 mr-2" />
            {groupByAssignment ? 'Grouped View' : 'List View'}
          </button>
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
          {trip.groups.length > 1 && (
            <button
              onClick={exportAllGroupPDFs}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export All Groups
            </button>
          )}
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
        <div className="space-y-6 max-w-4xl">
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
              const assignedGroup = trip.groups.find(g => g.id === item.assignedGroupId);
              
              // Helper function to get color classes based on group color
              const getGroupColorClasses = () => {
                if (!assignedGroup) {
                  return 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300';
                }
                
                // Map group colors to Tailwind classes (using actual hex values from GROUP_COLORS)
                const colorMap: Record<string, string> = {
                  '#4299E1': 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300',
                  '#48BB78': 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300',
                  '#ED8936': 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-300',
                  '#9F7AEA': 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300',
                  '#F56565': 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300',
                  '#38B2AC': 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900 dark:border-teal-700 dark:text-teal-300',
                  '#ED64A6': 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900 dark:border-pink-700 dark:text-pink-300',
                  '#ECC94B': 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300',
                };
                
                return colorMap[assignedGroup.color] || 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300';
              };
              
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
                  
                  <div className="flex-1 flex items-center justify-between">
                    <div className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {item.name}{item.quantity > 1 && <span className="ml-1 text-sm text-gray-500">×{item.quantity}</span>}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={item.assignedGroupId || ''}
                        onChange={(e) => updateItemGroup(item.id, e.target.value || undefined)}
                        className={`px-3 py-1 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getGroupColorClasses()}`}
                      >
                        <option value="">All Groups</option>
                        {trip.groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name} ({group.size} people)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            };

            // If grouping by assignment, reorganize the display
            if (groupByAssignment) {
              // Create groups for each assignment
              const groupedItems: Record<string, ShoppingItem[]> = {
                'all': [],
                ...Object.fromEntries(trip.groups.map(g => [g.id, []]))
              };
              
              // Sort items into groups
              sortedItems.forEach(item => {
                const groupKey = item.assignedGroupId || 'all';
                if (groupKey === 'all') {
                  groupedItems['all']?.push(item);
                } else if (groupedItems[groupKey]) {
                  groupedItems[groupKey]!.push(item);
                }
              });
              
              const allGroupItems = groupedItems['all'] || [];
              
              return (
                <>
                  {/* All Groups Section */}
                  {allGroupItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          👥 All Groups
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {allGroupItems.length} items
                        </span>
                      </div>
                      <div className="space-y-2">
                        {allGroupItems.map(renderItem)}
                      </div>
                    </div>
                  )}
                  
                  {/* Individual Group Sections */}
                  {trip.groups.map(group => {
                    const items = groupedItems[group.id];
                    if (!items || items.length === 0) return null;
                    
                    // Get group color classes
                    const colorMap: Record<string, { bg: string, text: string, border: string }> = {
                      '#4299E1': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
                      '#48BB78': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
                      '#ED8936': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
                      '#9F7AEA': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
                      '#F56565': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
                      '#38B2AC': { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-700' },
                      '#ED64A6': { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-700' },
                      '#ECC94B': { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' },
                    };
                    
                    const colors = colorMap[group.color] || { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
                    
                    return (
                      <div key={group.id} className={`rounded-lg p-4 ${colors.bg} border ${colors.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className={`text-lg font-medium ${colors.text}`}>
                              {group.name}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {items.length} items • {group.size} people
                            </span>
                          </div>
                          <button
                            onClick={() => exportGroupPDF(group)}
                            className={`inline-flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                              colors.text.includes('blue') 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : colors.text.includes('green')
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : colors.text.includes('orange')
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : colors.text.includes('purple')
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : colors.text.includes('red')
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : colors.text.includes('teal')
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : colors.text.includes('pink')
                                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                : colors.text.includes('yellow')
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                            title={`Export ${group.name} shopping list`}
                          >
                            <FileDown className="h-4 w-4 mr-1" />
                            Export
                          </button>
                        </div>
                        <div className="space-y-2">
                          {items.map(renderItem)}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            }
            
            // Original category-based view
            return (
              <>
                {/* Packing Items Section */}
                {packingItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        🎒 Packing Items
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Assign to groups
                      </div>
                    </div>
                    <div className="space-y-2">
                      {packingItems.map(renderItem)}
                    </div>
                  </div>
                )}

                {/* Ingredients Section */}
                {ingredientItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        🍽️ Meal Ingredients
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Assign to groups
                      </div>
                    </div>
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
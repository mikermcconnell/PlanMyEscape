import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, Trash2, Edit3, X, Package, Utensils, Users, Shield, Sun, Home, ShoppingCart, CheckCircle, RotateCcw } from 'lucide-react';
import { PackingItem, Trip, ShoppingItem, TripType } from '../types';
import { getPackingList, savePackingList, addToShoppingList } from '../utils/storage';
import { getPackingListDescription } from '../data/packingTemplates';
import { separateAndItems, PackingSuggestion } from '../data/activityEquipment';
import ShoppingList from '../components/ShoppingList';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

// ----------------------------------
// Constants
// ----------------------------------
// Packing categories never change, so defining them at module level keeps
// the array identity stable across renders and eliminates 'missing dependency' warnings.
export const PACKING_CATEGORIES = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Food', 'Other'] as const;

const PackingList = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [items, setItems] = useState<PackingItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const groupOptions = [{ id: 'all', name: 'All' as const }, ...trip.groups];
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const categories = PACKING_CATEGORIES;
  const [addItemModal, setAddItemModal] = useState<{ 
    show: boolean; 
    category: string; 
    name: string; 
    quantity: number; 
    assignedGroupId?: string; 
    isPersonal: boolean;
  }>({ show: false, category: '', name: '', quantity: 1, isPersonal: false });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Ref to keep track of the current timeout across renders
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function – clears any existing timeout before scheduling a new one
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    (tripId: string, items: PackingItem[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        savePackingList(tripId, items).catch(error => {
          console.error('Failed to save packing list:', error);
          setUpdateError('Failed to save packing list. Please try again.');
        });
      }, 300);
    },
    [] // Empty dependency array is correct here
  );

  // Memoized function to update items state and trigger save
  const updateItems = useCallback(
    (newItems: PackingItem[]) => {
      setItems(newItems);
      debouncedSave(tripId, newItems);
    },
    [tripId, debouncedSave]
  );

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Add proper useMemo with typed parameters
  const displayedItems = useMemo(() =>
    selectedGroupId === 'all'
      ? items
      : items.filter((i: PackingItem) => i.assignedGroupId === selectedGroupId),
    [items, selectedGroupId]);

  const personalItems = useMemo(() => displayedItems.filter((item: PackingItem) => item.isPersonal), [displayedItems]);
  const groupItems = useMemo(() => displayedItems.filter((item: PackingItem) => !item.isPersonal), [displayedItems]);
  
  const groupedPersonalItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = personalItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [personalItems, categories]);
  
  const groupedGroupItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = groupItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [groupItems, categories]);

  const totalItems = displayedItems.length;
  const ownedItems = displayedItems.filter((item: PackingItem) => item.isOwned).length;
  const needToBuyItems = displayedItems.filter((item: PackingItem) => item.needsToBuy).length;
  const packedItems = displayedItems.filter((item: PackingItem) => item.isPacked).length;
  const totalWeight = displayedItems.reduce((sum: number, item: PackingItem) => sum + (item.weight || 0), 0);

  const renderTripTypeText = (type: TripType): string => {
    switch (type) {
      case 'car camping':
        return 'Car Camping';
      case 'canoe camping':
        return 'Canoe Camping';
      case 'hike camping':
        return 'Hike Camping';
      case 'cottage':
        return 'Cottage';
      default:
        return 'Trip';
    }
  };

  const shouldShowWeightTracking = (type: TripType): boolean => {
    return type === 'hike camping' || type === 'canoe camping';
  };

  const assignItemToGroup = (itemId: string, groupId: string | undefined) => {
    const updatedItems = items.map((item: PackingItem) => {
      if (item.id === itemId) {
        return {
          ...item,
          assignedGroupId: groupId
        };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const openAddItemModal = (category: string, assignedGroupId?: string, isPersonal: boolean = false) => {
    setAddItemModal({ 
      show: true, 
      category: category, 
      name: '', 
      quantity: 1,
      assignedGroupId: assignedGroupId,
      isPersonal: isPersonal
    });
  };

  const closeAddItemModal = () => {
    setAddItemModal({ show: false, category: '', name: '', quantity: 1, isPersonal: false });
  };

  const addItemFromModal = async () => {
    if (!addItemModal.name.trim()) return;
    
    // Create a suggestion object to use the separateAndItems function
    const suggestions = separateAndItems([{
      name: addItemModal.name.trim(),
      category: addItemModal.category,
      required: false,
      quantity: addItemModal.quantity
    }]);
    
    // Create packing items from the separated suggestions
    const newItems: PackingItem[] = suggestions.map((suggestion: PackingSuggestion) => ({
      id: crypto.randomUUID(),
      name: suggestion.name,
      category: suggestion.category,
      quantity: suggestion.quantity || 1,
      isChecked: false,
      weight: undefined,
      isOwned: false,
      needsToBuy: false,
      isPacked: false,
      required: suggestion.required,
      assignedGroupId: addItemModal.assignedGroupId,
      isPersonal: addItemModal.isPersonal
    }));
    
    // Add to the current items list
    const updatedItems = [...items, ...newItems];
    updateItems(updatedItems);
    
    // Reset the form
    closeAddItemModal();
  };

  const updateAddFormField = (field: 'name' | 'quantity', value: string | number) => {
    setAddItemModal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalCampers = (trip: Trip): number => {
    return trip.groups.reduce((total, group) => total + group.size, 0);
  };



  // Load the packing list from storage
  useEffect(() => {
    const loadPackingList = async () => {
      try {
        const savedItems = await getPackingList(tripId);
        setItems(savedItems);
      } catch (error) {
        console.error('Failed to load packing list:', error);
        setUpdateError('Failed to load packing list. Please refresh the page.');
      }
    };
    
    loadPackingList();
  }, [tripId]);

  const toggleOwned = async (itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isOwned: !item.isOwned
        };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const toggleNeedsToBuy = async (itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const newNeedsToBuy = !item.needsToBuy;
        // Also add to shopping list if marking as "needs to buy"
        if (newNeedsToBuy) {
          const shoppingItem: ShoppingItem = {
            id: crypto.randomUUID(),
            name: item.name,
            category: item.category === 'Kitchen' || item.category === 'Food' ? 'food' : 'camping',
            quantity: item.quantity,
            isChecked: false,
            isOwned: false,
            needsToBuy: true,
            sourceItemId: item.id
          };
          addToShoppingList(tripId, [shoppingItem]);
        }
        return {
          ...item,
          needsToBuy: newNeedsToBuy
        };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const togglePacked = async (itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isPacked: !item.isPacked
        };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const updateItem = async (itemId: string, updates: Partial<PackingItem>) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const deleteItem = async (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    updateItems(updatedItems);
  };

  const clearUserInput = async () => {
    // Reset all base items to their default state (remove user modifications)
    // and remove all user-added items (items with required: false)
    const clearedItems = items
      .filter(item => item.required) // Keep only template items (required: true)
      .map(item => ({
        ...item,
        isOwned: false,
        needsToBuy: false, // Reset needsToBuy to false
        isPacked: false,
        assignedGroupId: undefined
      }));
    
    updateItems(clearedItems);
    
    // Also clear shopping items that were added from this packing list
    const { getShoppingList, saveShoppingList } = await import('../utils/storage');
    const shoppingItems = await getShoppingList(tripId);
    const filteredShoppingItems = shoppingItems.filter(item => !item.sourceItemId);
    await saveShoppingList(tripId, filteredShoppingItems);
    
    setShowClearConfirmation(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shelter':
        return <Home className="h-5 w-5 mr-2" />;
      case 'Kitchen':
        return <Utensils className="h-5 w-5 mr-2" />;
      case 'Clothing':
        return <Users className="h-5 w-5 mr-2" />;
      case 'Personal':
        return <Shield className="h-5 w-5 mr-2" />;
      case 'Tools':
        return <Package className="h-5 w-5 mr-2" />;
      case 'Sleep':
        return <Sun className="h-5 w-5 mr-2" />;
      case 'Comfort':
        return <Home className="h-5 w-5 mr-2" />;
      case 'Pack':
        return <Package className="h-5 w-5 mr-2" />;
      case 'Food':
        return <Utensils className="h-5 w-5 mr-2" />;
      default:
        return <Package className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <div className="mx-auto w-full md:max-w-5xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow p-8">
      {updateError && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {updateError}
        </div>
      )}

      {/* Group selector tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {groupOptions.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${selectedGroupId === g.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600/50'}`}
          >
            {g.name === 'All' ? 'All Items' : `${g.name} list`}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Packing List
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {trip.tripName} • {renderTripTypeText(trip.tripType)} • {calculateTotalCampers(trip)} person{calculateTotalCampers(trip) > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {getPackingListDescription(trip.tripType)}
            </p>
            {trip.isCoordinated && (
              <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                <Users className="h-4 w-4 inline mr-1" />
                Items can be assigned to specific groups
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear List
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Icons</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
            <div className="flex items-center">
              <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mr-2">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Packed</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{packedItems}/{totalItems}</div>
            <div className="text-sm text-gray-500">Packed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{ownedItems}/{totalItems}</div>
            <div className="text-sm text-gray-500">Owned</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{needToBuyItems}</div>
            <div className="text-sm text-gray-500">Need to Buy</div>
          </div>
          {shouldShowWeightTracking(trip.tripType) && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{Math.round(totalWeight / 1000 * 10) / 10}kg</div>
              <div className="text-sm text-gray-500">Total Weight</div>
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
                Clear User Input
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
                This will remove all user-added items and reset the status of template items (owned, needs to buy, packed) back to their default state. Items marked as "need to buy" will also be removed from the shopping list.
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

      {/* Add Item Modal */}
      {addItemModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Item to {addItemModal.category}
              </h3>
              <button
                onClick={closeAddItemModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="Item name"
                  value={addItemModal.name}
                  onChange={(e) => updateAddFormField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={addItemModal.quantity}
                  onChange={(e) => updateAddFormField('quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={addItemFromModal}
                  disabled={!addItemModal.name.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
                <button
                  onClick={closeAddItemModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packing List */}
      <div className="space-y-8">
        {/* Personal Items Section */}
        {personalItems.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Personal Items (Per Person)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Each person in your group needs their own
              </p>
            </div>
            {categories.map(category => {
              const categoryItems: PackingItem[] = groupedPersonalItems[category] ?? [];
              if (categoryItems.length === 0) return null;

              return (
                <div key={`personal-${category}`} className="bg-white dark:bg-gray-800 shadow rounded-lg pt-8">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2">{category}</span>
                      </h3>
                      <button
                        onClick={() => openAddItemModal(category, selectedGroupId !== 'all' ? selectedGroupId : undefined, true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryItems.map((item: PackingItem) => (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Status Buttons */}
                            <div className="flex items-center space-x-2">
                              {/* Need to Buy Button - show unless owned */}
                              {!item.isOwned && (
                                <button
                                  onClick={() => toggleNeedsToBuy(item.id)}
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
                              {/* Owned Button - always show */}
                              <button
                                onClick={() => toggleOwned(item.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  item.isOwned 
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                }`}
                                title={item.isOwned ? "You own this item" : "Mark as owned"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              {/* Packed Button - always show */}
                              <button
                                onClick={() => togglePacked(item.id)}
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
                            {/* Item Details */}
                            {editingItem === item.id ? (
                              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                                  style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                                />
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                <div 
                                  onClick={() => setEditingItem(item.id)}
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
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-sm border rounded-md py-1 px-2 dark:bg-gray-700 ml-2"
                                    style={{
                                      borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                      color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                    }}
                                  >
                                    <option value="">Shared</option>
                                    {trip.groups.map((group) => (
                                      <option key={group.id} value={group.id}>
                                        {group.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <div className="flex items-center space-x-2 ml-4">
                                  <Edit3 className="h-4 w-4 text-gray-400" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                {/* Status Badge */}
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Need to Buy
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Edit and Delete buttons moved to item text area */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group Items Section */}
        {groupItems.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Group Items (Shared by Everyone)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your group only needs one of each of these items
              </p>
            </div>
            {categories.map(category => {
              const categoryItems: PackingItem[] = groupedGroupItems[category] ?? [];
              if (categoryItems.length === 0) return null;

              return (
                <div key={`group-${category}`} className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2">{category}</span>
                      </h3>
                      <button
                        onClick={() => openAddItemModal(category, selectedGroupId !== 'all' ? selectedGroupId : undefined, false)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryItems.map((item: PackingItem) => (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Status Buttons */}
                            <div className="flex items-center space-x-2">
                              {/* Need to Buy Button - show unless owned */}
                              {!item.isOwned && (
                                <button
                                  onClick={() => toggleNeedsToBuy(item.id)}
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
                              {/* Owned Button - always show */}
                              <button
                                onClick={() => toggleOwned(item.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  item.isOwned 
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                }`}
                                title={item.isOwned ? "You own this item" : "Mark as owned"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              {/* Packed Button - always show */}
                              <button
                                onClick={() => togglePacked(item.id)}
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
                            {/* Item Details */}
                            {editingItem === item.id ? (
                              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                                  style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                                />
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                <div 
                                  onClick={() => setEditingItem(item.id)}
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
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-sm border rounded-md py-1 px-2 dark:bg-gray-700 ml-2"
                                    style={{
                                      borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                      color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                    }}
                                  >
                                    <option value="">Shared</option>
                                    {trip.groups.map((group) => (
                                      <option key={group.id} value={group.id}>
                                        {group.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <div className="flex items-center space-x-2 ml-4">
                                  <Edit3 className="h-4 w-4 text-gray-400" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                {/* Status Badge */}
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Need to Buy
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Edit and Delete buttons moved to item text area */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shopping List Modal */}
      {showShoppingList && tripId && (
        <ShoppingList 
          tripId={tripId} 
          onClose={() => setShowShoppingList(false)} 
        />
      )}
    </div>
  );
};

export default PackingList; 
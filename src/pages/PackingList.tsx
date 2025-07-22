import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, Trash2, Edit3, X, Package, Utensils, Users, Shield, Sun, Home, ShoppingCart, CheckCircle, RotateCcw, Activity, Tent, UtensilsCrossed, Shirt, Wrench, Bed, Gamepad2, Backpack, Car, Zap, Camera, Flashlight, Compass, Flame, ChefHat, Coffee, Hammer, Key, Phone, Book, Music, Gift, Map, Heart, Droplets, Smile, StickyNote } from 'lucide-react';
import { PackingItem, Trip, ShoppingItem, TripType } from '../types';
import { getPackingList, savePackingList, addToShoppingList } from '../utils/storage';
import { getPackingListDescription, getPackingTemplate } from '../data/packingTemplates';
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
export const PACKING_CATEGORIES = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Safety', 'Transportation', 'Fun and games', 'Other'] as const;

// Icon mapping function for packing items
const getItemIcon = (itemName: string, category: string) => {
  const name = itemName.toLowerCase();
  
  // Specific item name matches (highest priority)
  if (name.includes('tent')) return { icon: Tent, color: 'text-green-500' };
  if (name.includes('sleeping bag') || name.includes('sleep sack')) return { icon: Bed, color: 'text-blue-500' };
  if (name.includes('pillow')) return { icon: Bed, color: 'text-purple-500' };
  if (name.includes('flashlight') || name.includes('headlamp') || name.includes('torch')) return { icon: Flashlight, color: 'text-yellow-500' };
  if (name.includes('first aid') || name.includes('medical')) return { icon: Heart, color: 'text-red-500' };
  if (name.includes('knife') || name.includes('multi-tool')) return { icon: Wrench, color: 'text-gray-600' };
  if (name.includes('compass')) return { icon: Compass, color: 'text-indigo-500' };
  if (name.includes('map')) return { icon: Map, color: 'text-orange-500' };
  if (name.includes('camera')) return { icon: Camera, color: 'text-pink-500' };
  if (name.includes('phone') || name.includes('mobile')) return { icon: Phone, color: 'text-blue-600' };
  if (name.includes('battery') || name.includes('power bank')) return { icon: Zap, color: 'text-yellow-600' };
  if (name.includes('stove') || name.includes('burner')) return { icon: Flame, color: 'text-red-600' };
  if (name.includes('pot') || name.includes('pan') || name.includes('cookware')) return { icon: ChefHat, color: 'text-orange-600' };
  if (name.includes('coffee') || name.includes('tea')) return { icon: Coffee, color: 'text-amber-700' };
  if (name.includes('water bottle') || name.includes('hydration')) return { icon: Droplets, color: 'text-blue-400' };
  if (name.includes('backpack') || name.includes('pack') || name.includes('bag')) return { icon: Backpack, color: 'text-green-600' };
  if (name.includes('shirt') || name.includes('t-shirt')) return { icon: Shirt, color: 'text-teal-500' };
  if (name.includes('jacket') || name.includes('coat')) return { icon: Shield, color: 'text-gray-700' };
  if (name.includes('soap') || name.includes('shampoo') || name.includes('wash')) return { icon: Droplets, color: 'text-cyan-500' };
  if (name.includes('toothbrush') || name.includes('dental')) return { icon: Smile, color: 'text-green-400' };
  if (name.includes('game') || name.includes('cards') || name.includes('puzzle')) return { icon: Gamepad2, color: 'text-purple-600' };
  if (name.includes('book') || name.includes('journal')) return { icon: Book, color: 'text-amber-600' };
  if (name.includes('music') || name.includes('speaker') || name.includes('headphones')) return { icon: Music, color: 'text-violet-500' };
  if (name.includes('rope') || name.includes('cord')) return { icon: Activity, color: 'text-orange-400' };
  if (name.includes('hammer') || name.includes('tool')) return { icon: Hammer, color: 'text-gray-500' };
  if (name.includes('key') || name.includes('lock')) return { icon: Key, color: 'text-yellow-700' };
  if (name.includes('gift') || name.includes('present')) return { icon: Gift, color: 'text-red-400' };
  if (name.includes('sunscreen') || name.includes('sun protection')) return { icon: Sun, color: 'text-yellow-500' };
  if (name.includes('insect') || name.includes('bug spray')) return { icon: Shield, color: 'text-green-500' };
  
  // Category-based fallbacks (lower priority)
  switch (category.toLowerCase()) {
    case 'shelter':
      return { icon: Tent, color: 'text-green-500' };
    case 'kitchen':
      return { icon: UtensilsCrossed, color: 'text-orange-500' };
    case 'clothing':
      return { icon: Shirt, color: 'text-blue-500' };
    case 'personal':
      return { icon: Smile, color: 'text-teal-500' };
    case 'tools':
      return { icon: Wrench, color: 'text-gray-600' };
    case 'sleep':
      return { icon: Bed, color: 'text-purple-500' };
    case 'comfort':
    case 'fun and games':
      return { icon: Gamepad2, color: 'text-purple-600' };
    case 'pack':
      return { icon: Backpack, color: 'text-green-600' };
    case 'safety':
      return { icon: Heart, color: 'text-red-500' };
    case 'transportation':
      return { icon: Car, color: 'text-blue-600' };
    default:
      return { icon: Package, color: 'text-gray-500' };
  }
};

const PackingList = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [items, setItems] = useState<PackingItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
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
  const [confirmation, setConfirmation] = useState<string | null>(null);

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

  const resetToTemplate = async () => {
    try {
      const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);
      const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const templateItems = getPackingTemplate(trip.tripType, totalCampers, tripDays);
      
      // Save the template items and set them
      await savePackingList(tripId, templateItems);
      setItems(templateItems);
    } catch (error) {
      console.error('Failed to reset to template:', error);
      setUpdateError('Failed to reset to template. Please try again.');
    }
  };



  // Load the packing list from storage
  useEffect(() => {
    const loadPackingList = async () => {
      try {
        const savedItems = await getPackingList(tripId);
        
        // If no saved items exist, load the appropriate template
        if (savedItems.length === 0) {
          const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);
          const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
          const templateItems = getPackingTemplate(trip.tripType, totalCampers, tripDays);
          
          // Save the template items and set them
          await savePackingList(tripId, templateItems);
          setItems(templateItems);
        } else {
          setItems(savedItems);
        }
      } catch (error) {
        console.error('Failed to load packing list:', error);
        setUpdateError('Failed to load packing list. Please refresh the page.');
      }
    };
    
    loadPackingList();
  }, [tripId, trip.tripType, trip.groups, trip.startDate, trip.endDate]);

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
          // Show confirmation message
          setConfirmation(`${item.name} added to shopping list!`);
          setTimeout(() => setConfirmation(null), 2000);
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

  const startEditingNotes = (itemId: string, currentNotes?: string) => {
    setEditingNotes(itemId);
    setNotesText(currentNotes || '');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const saveNotes = async (itemId: string) => {
    await updateItem(itemId, { notes: notesText.trim() || undefined });
    setEditingNotes(null);
    setNotesText('');
  };

  const clearUserInput = async () => {
    // Reset all items' status icons to their default state (keep all items, just reset status)
    const clearedItems = items.map(item => ({
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
      case 'Activity Items':
        return <Activity className="h-5 w-5 mr-2" />;
      case 'Fun and games':
        return <Activity className="h-5 w-5 mr-2" />;
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
    <div className="mx-auto w-full md:max-w-5xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow p-4 sm:p-8">
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
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Packing List
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {trip.tripName} • {renderTripTypeText(trip.tripType)} • {calculateTotalCampers(trip)} person{calculateTotalCampers(trip) > 1 ? 's' : ''}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              {getPackingListDescription(trip.tripType)}
            </p>
            {trip.isCoordinated && (
              <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-400 mt-1">
                <Users className="h-4 w-4 inline mr-1" />
                Items can be assigned to specific groups
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center sm:items-start">
            <button
              onClick={resetToTemplate}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Reset {renderTripTypeText(trip.tripType)} Packing List</span>
              <span className="sm:hidden">Reset Template</span>
            </button>
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
              Clear Status Icons
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
        
        {/* Legend */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clear Status Icons
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
                This will reset all status icons (owned, needs to buy, packed) back to their default state while keeping all items. Items marked as "need to buy" will also be removed from the shopping list.
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={clearUserInput}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Clear Status Icons
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
                      <div key={item.id} className="px-3 sm:px-6 py-4">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          <div className="space-y-3">
                            {/* Top row: Status buttons and item name */}
                            <div className="flex items-center space-x-2">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-1">
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
                              
                              {/* Item name and details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setEditingItem(item.id)}
                                  className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
                                >
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {React.createElement(getItemIcon(item.name, item.category).icon, {
                                        className: `h-4 w-4 ${getItemIcon(item.name, item.category).color} flex-shrink-0`
                                      })}
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
                                    onClick={() => setEditingItem(item.id)}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingNotes(item.id, item.notes);
                                    }}
                                    className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
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
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add notes about this item..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => saveNotes(item.id)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Display existing notes */}
                            {item.notes && editingNotes !== item.id && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                  <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Bottom row: Group assignment and status badges */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {/* Group Assignment */}
                                {trip.isCoordinated && (
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-xs border rounded-md py-1 px-2 dark:bg-gray-700"
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
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex items-center space-x-1">
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Buy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-2">
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
                                    <button
                                      onClick={() => setEditingItem(item.id)}
                                      className="text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingNotes(item.id, item.notes);
                                      }}
                                      className={`${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                    >
                                      <StickyNote className="h-4 w-4" />
                                    </button>
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
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes about this item..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => saveNotes(item.id)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Display existing notes for desktop */}
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
                      <div key={item.id} className="px-3 sm:px-6 py-4">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          <div className="space-y-3">
                            {/* Top row: Status buttons and item name */}
                            <div className="flex items-center space-x-2">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-1">
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
                              
                              {/* Item name and details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setEditingItem(item.id)}
                                  className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
                                >
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {React.createElement(getItemIcon(item.name, item.category).icon, {
                                        className: `h-4 w-4 ${getItemIcon(item.name, item.category).color} flex-shrink-0`
                                      })}
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
                                    onClick={() => setEditingItem(item.id)}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingNotes(item.id, item.notes);
                                    }}
                                    className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
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
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add notes about this item..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => saveNotes(item.id)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Display existing notes */}
                            {item.notes && editingNotes !== item.id && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                  <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Bottom row: Group assignment and status badges */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {/* Group Assignment */}
                                {trip.isCoordinated && (
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-xs border rounded-md py-1 px-2 dark:bg-gray-700"
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
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex items-center space-x-1">
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Buy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-2">
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
                                    <button
                                      onClick={() => setEditingItem(item.id)}
                                      className="text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingNotes(item.id, item.notes);
                                      }}
                                      className={`${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                    >
                                      <StickyNote className="h-4 w-4" />
                                    </button>
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
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes about this item..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => saveNotes(item.id)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Display existing notes for desktop */}
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
        )}
      </div>

      {/* Shopping List Modal */}
      {showShoppingList && tripId && (
        <ShoppingList 
          tripId={tripId}
          groups={trip.groups}
          onClose={() => setShowShoppingList(false)} 
        />
      )}

      {/* Confirmation Message */}
      {confirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {confirmation}
        </div>
      )}
    </div>
  );
};

export default PackingList; 
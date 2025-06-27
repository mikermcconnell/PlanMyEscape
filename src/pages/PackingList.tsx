import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Plus, Trash2, Edit3, Save, X, Package, Utensils, Users, Shield, Sun, Home, ShoppingCart, CheckCircle } from 'lucide-react';
import { PackingItem, Trip, ShoppingItem, TripType } from '../types';
import { getPackingList, savePackingList, getTrips, addToShoppingList, getShoppingList } from '../utils/storage';
import { packingTemplates, specializedGear, tripTypeDescriptions } from '../data/packingTemplates';
import ShoppingList from '../components/ShoppingList';

const PackingList = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const categories = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Other'];
  const [addItemForms, setAddItemForms] = useState<Record<string, { show: boolean; name: string; quantity: number }>>(
    categories.reduce((acc, category) => ({
      ...acc,
      [category]: { show: false, name: '', quantity: 1 }
    }), {})
  );

  const calculateTotalCampers = (trip: Trip): number => {
    return trip.groups.reduce((sum, group) => sum + group.size, 0);
  };

  useEffect(() => {
    const loadTripAndPackingList = async () => {
      if (!tripId) return;

      const trips = await getTrips();
      const currentTrip = trips.find(t => t.id === tripId);
      if (!currentTrip) return;

      setTrip(currentTrip);
      const savedList = await getPackingList(tripId);
      
      if (savedList && savedList.length > 0) {
        setItems(savedList);
      } else {
        const template = packingTemplates[currentTrip.tripType];
        const initializedTemplate: PackingItem[] = template.essentials.concat(template.recommended).map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          name: item,
          category: 'General',
          isPacked: false,
          isOwned: false,
          isChecked: false,
          needsToBuy: false,
          required: true,
          quantity: 1
        }));
        setItems(initializedTemplate);
        await savePackingList(tripId, initializedTemplate);
      }
    };
    loadTripAndPackingList();
  }, [tripId]);

  const toggleOwned = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { 
        ...item, 
        isOwned: !item.isOwned,
        needsToBuy: false // Remove need to buy when marking as owned
      } : item
    );
    setItems(updatedItems);
    if (tripId) savePackingList(tripId, updatedItems);
  };

  const toggleNeedsToBuy = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { 
        ...item, 
        needsToBuy: !item.needsToBuy,
      } : item
    );
    setItems(updatedItems);
    if (tripId) {
      savePackingList(tripId, updatedItems);
      
      // If marking as need to buy, add to shopping list
      const item = updatedItems.find(i => i.id === itemId);
      if (item && item.needsToBuy) {
        // Check if item is already in shopping list
        const existingShoppingList = getShoppingList(tripId);
        const alreadyInList = existingShoppingList.some(shoppingItem => 
          shoppingItem.sourceItemId === itemId
        );
        
        if (!alreadyInList) {
          const shoppingItem: ShoppingItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: item.name,
            quantity: item.quantity,
            category: item.category === 'Kitchen' ? 'food' : 'camping',
            isChecked: false,
            sourceItemId: itemId
          };
          addToShoppingList(tripId, [shoppingItem]);
        }
      }
    }
  };

  const togglePacked = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    setItems(updatedItems);
    if (tripId) savePackingList(tripId, updatedItems);
  };

  // Legacy function for backward compatibility
  const toggleItem = (itemId: string) => {
    togglePacked(itemId);
  };

  const updateItem = (itemId: string, updates: Partial<PackingItem>) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setItems(updatedItems);
    if (tripId) savePackingList(tripId, updatedItems);
    setEditingItem(null);
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    if (tripId) savePackingList(tripId, updatedItems);
  };

  const addItem = (category: string) => {
    const formData = addItemForms[category];
    if (formData.name.trim()) {
      const item: PackingItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: formData.name.trim(),
        category: category,
        quantity: formData.quantity,
        isChecked: false,
        isOwned: false,
        needsToBuy: false,
        isPacked: false,
        required: true // Default to required for user-added items
      };
      const updatedItems = [...items, item];
      setItems(updatedItems);
      if (tripId) savePackingList(tripId, updatedItems);
      
      // Reset the form for this category
      setAddItemForms(prev => ({
        ...prev,
        [category]: { show: false, name: '', quantity: 1 }
      }));
    }
  };

  const toggleAddForm = (category: string) => {
    setAddItemForms(prev => ({
      ...prev,
      [category]: { ...prev[category], show: !prev[category].show }
    }));
  };

  const updateAddFormField = (category: string, field: 'name' | 'quantity', value: string | number) => {
    setAddItemForms(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shelter': return <Home className="h-4 w-4" />;
      case 'Kitchen': return <Utensils className="h-4 w-4" />;
      case 'Clothing': return <Users className="h-4 w-4" />;
      case 'Personal': return <Sun className="h-4 w-4" />;
      case 'Tools': return <Shield className="h-4 w-4" />;
      case 'Sleep': return <Home className="h-4 w-4" />;
      case 'Comfort': return <Sun className="h-4 w-4" />;
      case 'Pack': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const totalItems = items.length;
  const ownedItems = items.filter(item => item.isOwned).length;
  const needToBuyItems = items.filter(item => item.needsToBuy).length;
  const packedItems = items.filter(item => item.isPacked).length;
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

  const addItemToShoppingList = async (item: PackingItem) => {
    if (!tripId) return;
    
    const shoppingItem: ShoppingItem = {
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      category: 'camping',
      isChecked: false,
      sourceItemId: item.id
    };
    await addToShoppingList(tripId, [shoppingItem]);
  };

  const handleAddToShoppingList = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item && tripId) {
      await addItemToShoppingList(item);
    }
  };

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
        return type;
    }
  };

  const getPackingListDescription = (type: TripType): string => {
    return tripTypeDescriptions[type];
  };

  const shouldShowWeightTracking = (type: TripType): boolean => {
    return type === 'hike camping' || type === 'canoe camping';
  };

  const assignItemToGroup = (itemId: string, groupId: string | undefined) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          assignedGroupId: groupId
        };
      }
      return item;
    });
    setItems(updatedItems);
    if (tripId) savePackingList(tripId, updatedItems);
  };

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Trip not found</h3>
          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
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
          <div className="flex space-x-2">
            <button
              onClick={() => setShowShoppingList(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shopping List
            </button>
            <Link
              to={`/meal-planner/${tripId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Meal Planner
            </Link>
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

      {/* Add Item Form */}
      {Object.entries(addItemForms).map(([category, formData]) => {
        if (!formData.show) return null;
        return (
          <div key={category} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Item name"
                value={formData.name}
                onChange={(e) => updateAddFormField(category, 'name', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              />
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => updateAddFormField(category, 'quantity', parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleAddForm(category)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Packing List */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryItems = groupedItems[category];
          if (categoryItems.length === 0) return null;

          // Split into required and optional
          const requiredItems = categoryItems.filter(item => item.required);
          const optionalItems = categoryItems.filter(item => !item.required);

          return (
            <div key={category} className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    {getCategoryIcon(category)}
                    <span className="ml-2">{category}</span>
                  </h3>
                  <button
                    onClick={() => toggleAddForm(category)}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Required Items */}
                {requiredItems.length > 0 && (
                  <>
                    <div className="px-6 pt-4 pb-2">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">Required</span>
                    </div>
                    {requiredItems.map(item => (
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
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 w-64"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) })}
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
                                  } truncate max-w-[200px]`}>
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
                  </>
                )}
                {/* Optional Items */}
                {optionalItems.length > 0 && (
                  <>
                    <div className="px-6 pt-4 pb-2">
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Optional</span>
                    </div>
                    {optionalItems.map(item => (
                      <div key={item.id} className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
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
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 w-64"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) })}
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
                                  } truncate max-w-[200px]`}>
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
                                {/* Optional badge */}
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-2">
                                  Optional
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Edit and Delete buttons moved to item text area */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
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
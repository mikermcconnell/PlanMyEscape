import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Edit3, X, ShoppingCart, Calendar, ArrowLeft, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import { Meal, Trip, TripType } from '../types';
import { getMeals, saveMeals } from '../utils/storage';
import { getMealTemplates } from '../data/mealTemplates';
import ShoppingList from '../components/ShoppingList';
import { ShoppingItem } from '../types';
import { saveShoppingList, getShoppingList, getPackingList, savePackingList } from '../utils/storage';
import { suggestIngredients } from '../data/recipeSuggestions';
import { tripMealSuggestions } from '../data/tripMealSuggestions';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const MealPlanner = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedType, setSelectedType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientQty, setNewIngredientQty] = useState<number>(1);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMealName, setCustomMealName] = useState('');
  const [, setSuggestedIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [showClearIngredientsConfirmation, setShowClearIngredientsConfirmation] = useState(false);

  useEffect(() => {
    const loadMeals = async () => {
      if (!tripId || !trip) return;
      
      const savedMeals = await getMeals(tripId);
      if (savedMeals) {
        setMeals(savedMeals);
      }
    };
    loadMeals();
  }, [tripId, trip]);

  // Load shopping list on mount (only meal-related items for ingredients sidebar)
  useEffect(() => {
    const loadShoppingList = async () => {
      if (!tripId) return;
      const savedShoppingList = await getShoppingList(tripId);
      // Filter to only show food items that are NOT from packing list
      const mealRelatedItems = savedShoppingList.filter(item => 
        !item.sourceItemId && item.category === 'food'
      );
      setShoppingItems(mealRelatedItems);
    };
    loadShoppingList();
  }, [tripId]);

  // Synchronise shopping list when meals change
  useEffect(() => {
    if (!tripId) return;

    // Generate aggregated list from meals
    const ingredientCounts = meals.length > 0 
      ? meals.flatMap(m => m.ingredients).reduce<Record<string, number>>((acc, ing) => {
          acc[ing] = (acc[ing] || 0) + 1;
          return acc;
        }, {})
      : {};

    // Update the global shopping list while preserving packing items
    (async () => {
      const existingShoppingItems = await getShoppingList(tripId);
      
      // Create a map of existing items for quick lookup
      const existingItems = new Map(existingShoppingItems.map(item => [item.name.toLowerCase(), item]));
      
      // Process meal ingredients only
      const mealIngredients = Object.entries(ingredientCounts).map(([name, count]) => {
        const existing = existingItems.get(name.toLowerCase());
        return {
          id: existing ? existing.id : crypto.randomUUID(),
          name,
          quantity: count,
          category: 'food' as const,
          needsToBuy: existing ? existing.needsToBuy : true,
          isOwned: existing ? existing.isOwned : false
          // No sourceItemId means it's from meals, not packing
        };
      });

      // Get items from packing list (items with sourceItemId) and manually added items
      const nonMealItems = existingShoppingItems.filter(item => 
        item.sourceItemId || // From packing list
        (item.category === 'camping') || // Manual camping items
        (!Object.keys(ingredientCounts).some(ingredient => 
          ingredient.toLowerCase() === item.name.toLowerCase()
        ) && item.category === 'food') // Manual food items not from current meals
      );

      // Combine all items for the global shopping list
      const allShoppingItems = [...mealIngredients, ...nonMealItems];
      await saveShoppingList(tripId, allShoppingItems);
      
      // Set local state to only meal-related items for the ingredients sidebar
      const manualFoodItems = existingShoppingItems.filter(item => 
        !item.sourceItemId && // Not from packing
        item.category === 'food' && // Food items only
        !Object.keys(ingredientCounts).some(ingredient => 
          ingredient.toLowerCase() === item.name.toLowerCase()
        ) // Manual food items
      );
      
      setShoppingItems([...mealIngredients, ...manualFoodItems]);
    })();
  }, [meals, tripId]);

  // Helpers for toggling status
  const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    // Update local ingredients list
    setShoppingItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updates } : it));
    
    // Update global shopping list
    if (tripId) {
      const allItems = await getShoppingList(tripId);
      const updatedAllItems = allItems.map(it => it.id === itemId ? { ...it, ...updates } : it);
      await saveShoppingList(tripId, updatedAllItems);
    }
  };

  const handleToggleNeedsToBuy = async (itemId: string) => {
    const current = shoppingItems.find(i => i.id === itemId);
    if (!current || !tripId) return;
    const newNeedsToBuy = !current.needsToBuy;
    if (!newNeedsToBuy) {
      // Remove from shopping list if unchecked
      const updated = shoppingItems.filter(i => i.id !== itemId);
      setShoppingItems(updated);
      await saveShoppingList(tripId, updated);
      return;
    }
    updateShoppingItem(itemId, { needsToBuy: true, isOwned: false });
    setConfirmation('Added to shopping list!');
    setTimeout(() => setConfirmation(null), 2000);
  };

  const handleToggleOwned = (itemId: string) => {
    const current = shoppingItems.find(i => i.id === itemId);
    if (!current) return;
    const newOwned = !current.isOwned;
    if (newOwned) {
      // Remove from shopping list if marked as owned
      const updated = shoppingItems.filter(i => i.id !== itemId);
      setShoppingItems(updated);
      if (tripId) saveShoppingList(tripId, updated);
      // Sync to packing list when marked owned
      if (tripId) {
        (async () => {
          const packing = await getPackingList(tripId);
          const exists = packing.find(p => p.name.toLowerCase() === current.name.toLowerCase() && p.category === 'Food');
          if (!exists) {
            const newPackingItem = {
              id: crypto.randomUUID(),
              name: current.name,
              category: 'Food',
              quantity: current.quantity,
              isChecked: false,
              isOwned: true,
              needsToBuy: false,
              isPacked: false,
              required: false,
              isPersonal: false
            } as any;
            await savePackingList(tripId, [...packing, newPackingItem]);
            setConfirmation('Added to packing list!');
            setTimeout(() => setConfirmation(null), 2000);
          }
        })();
      }
    } else {
      updateShoppingItem(itemId, { isOwned: false });
    }
  };

  useEffect(() => {
    if (customMealName.trim()) {
      const ingredients = suggestIngredients(customMealName);
      setSuggestedIngredients(ingredients);
    } else {
      setSuggestedIngredients([]);
    }
  }, [customMealName]);

  const getDaysArray = () => {
    if (!trip) return [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: days }, (_, i) => i + 1);
  };



  const deleteMeal = (mealId: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
  };

  const getMealsByType = (day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return meals.filter(meal => meal.day === day && meal.type === type);
  };

  const getMealTypeColor = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    switch (type) {
      case 'breakfast':
        return 'bg-orange-50 dark:bg-orange-700';
      case 'lunch':
        return 'bg-blue-50 dark:bg-blue-700';
      case 'dinner':
        return 'bg-purple-50 dark:bg-purple-700';
      default:
        return 'bg-gray-50 dark:bg-gray-700';
    }
  };

  // Computed ingredient list for empty state
  const shoppingListEmpty = shoppingItems.filter(item => item.needsToBuy).length === 0;

  const addCustomMeal = () => {
    if (customMealName.trim() && selectedIngredients.length > 0) {
      const newMeal = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: customMealName.trim(),
        day: selectedDay,
        type: selectedType,
        ingredients: selectedIngredients,
        isCustom: true,
        assignedGroupId: undefined,
        sharedServings: true,
        servings: 1 // Ensure servings is defined
      };
      const updatedMeals = [...meals, newMeal];
      setMeals(updatedMeals);
      if (tripId) saveMeals(tripId, updatedMeals);
      
      // Reset form
      setCustomMealName('');
      setSuggestedIngredients([]);
      setSelectedIngredients([]);
      setCustomIngredient('');
      setShowCustomForm(false);
      setShowMealModal(false);
    }
  };



  const addCustomIngredientToList = () => {
    if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
      setSelectedIngredients(prev => [...prev, customIngredient.trim()]);
      setCustomIngredient('');
    }
  };

  // Remove ingredient from suggestion list (during custom meal creation)
  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
  };

  // Remove item from ingredients list sidebar
  const removeShoppingItem = async (itemId: string) => {
    // Remove from local ingredients list
    setShoppingItems(prev => prev.filter(i => i.id !== itemId));
    
    // Remove from global shopping list
    if (tripId) {
      const allItems = await getShoppingList(tripId);
      const updated = allItems.filter(i => i.id !== itemId);
      await saveShoppingList(tripId, updated);
    }
  };

  const addIngredient = async () => {
    if (!newIngredientName.trim()) return;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newIngredientName.trim(),
      quantity: newIngredientQty,
      category: 'food',
      needsToBuy: true,
      isOwned: false
    };
    
    // Add to local ingredients list
    setShoppingItems(prev => [...prev, newItem]);
    
    // Add to global shopping list
    if (tripId) {
      const allItems = await getShoppingList(tripId);
      const updated = [...allItems, newItem];
      await saveShoppingList(tripId, updated);
    }
    
    setNewIngredientName('');
    setNewIngredientQty(1);
  };

  const clearIngredients = async () => {
    // Clear all custom meals (meals with isCustom: true)
    const clearedMeals = meals.filter(meal => !meal.isCustom);
    setMeals(clearedMeals);
    if (tripId) await saveMeals(tripId, clearedMeals);
    
    // Update global shopping list: remove custom meal ingredients, keep packing items
    const allShoppingItems = await getShoppingList(tripId);
    const remainingIngredients = clearedMeals.flatMap(m => m.ingredients);
    
    // Keep: 1) Packing items (with sourceItemId), 2) Template meal ingredients, 3) Manual food items
    const clearedGlobalShoppingItems = allShoppingItems.filter(item => {
      return item.sourceItemId || // From packing list
             remainingIngredients.includes(item.name) || // From remaining template meals
             (item.category === 'food' && !meals.flatMap(m => m.ingredients).includes(item.name)); // Manual food items
    });
    
    await saveShoppingList(tripId, clearedGlobalShoppingItems);
    
    // Update local ingredients sidebar to show only meal-related items
    setShoppingItems(clearedGlobalShoppingItems.filter(item => !item.sourceItemId && item.category === 'food'));
    
    setShowClearIngredientsConfirmation(false);
  };

  const saveIngredientEdit = async (itemId: string, name: string, qty: number) => {
    // Update local ingredients list
    setShoppingItems(prev => prev.map(i => i.id === itemId ? { ...i, name, quantity: qty } : i));
    
    // Update global shopping list
    if (tripId) {
      const allItems = await getShoppingList(tripId);
      const updated = allItems.map(i => i.id === itemId ? { ...i, name, quantity: qty } : i);
      await saveShoppingList(tripId, updated);
    }
    
    setEditingIngredientId(null);
  };

  const openMealModal = (day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedDay(day);
    setSelectedType(type);
    setShowMealModal(true);
    setShowCustomForm(false);
    setCustomMealName('');
    setSuggestedIngredients([]);
    setSelectedIngredients([]);
    setCustomIngredient('');
  };

  const totalPeople = trip?.groups.reduce((total, group) => total + group.size, 0) || 0;

  const getMealSuggestions = (type: TripType, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return tripMealSuggestions[type][mealType];
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

  const days = getDaysArray();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Meal Planner
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {renderTripTypeText(trip.tripType)} • 
              {totalPeople} {totalPeople === 1 ? 'person' : 'people'} total
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              You control serving amounts - set quantities that work for your group
            </p>
            {trip.isCoordinated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Meals can be assigned to specific groups
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Day Selection */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          disabled={selectedDay === 1}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-medium">Day {selectedDay}</span>
        <button
          onClick={() => setSelectedDay(prev => Math.min(days.length, prev + 1))}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          disabled={selectedDay === days.length}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meal Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Meal Calendar
              </h2>
            </div>
            
            <div className="p-6">
              {days.map(day => (
                <div key={day} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Day {day}
                  </h3>
                  
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
                    const dayMeals = getMealsByType(day, mealType);
                    
                    return (
                      <div key={mealType} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {mealType}
                          </h4>
                          <button
                            onClick={() => openMealModal(day, mealType)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {dayMeals.length === 0 ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No meals planned
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayMeals.map(meal => (
                              <div key={meal.id} className={`flex items-center justify-between p-2 ${getMealTypeColor(mealType)} rounded`}>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {meal.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {meal.ingredients.join(', ')}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => deleteMeal(meal.id)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ingredients List
              </h2>
              <button
                onClick={() => setShowClearIngredientsConfirmation(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </button>
            </div>
            
            <div className="p-6">
              {/* Add Ingredient Form */}
              <div className="mb-4 flex space-x-2">
                <input
                  type="text"
                  placeholder="Ingredient"
                  value={newIngredientName}
                  onChange={e => setNewIngredientName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm dark:bg-gray-700"
                />
                <input
                  type="number"
                  min="1"
                  value={newIngredientQty}
                  onChange={e => setNewIngredientQty(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 border rounded text-sm dark:bg-gray-700"
                />
                <button
                  onClick={addIngredient}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Legend */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">Status Icons</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className="p-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 mr-2">
                      <ShoppingCart className="h-3 w-3" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Need to Buy</span>
                  </div>
                  <div className="flex items-center">
                    <div className="p-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mr-2">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Owned</span>
                  </div>
                </div>
              </div>
              {shoppingListEmpty ? (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Add meals to generate shopping list
                </div>
              ) : (
                <div className="space-y-2">
                  {shoppingItems.filter(item => item.needsToBuy).map((item: ShoppingItem) => (
                    <div key={item.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      {/* Status buttons */}
                      <div className="flex items-center space-x-2 mr-3">
                        {/* Removed purchased icon */}
                        <button
                          onClick={() => handleToggleNeedsToBuy(item.id)}
                          className={`p-1 rounded-full transition-colors ${
                            item.needsToBuy ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                          }`}
                          title={item.needsToBuy ? 'Need to buy' : 'Mark as need to buy'}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleOwned(item.id)}
                          className={`p-1 rounded-full transition-colors ${
                            item.isOwned ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                          }`}
                          title={item.isOwned ? 'Owned' : 'Mark as owned'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      </div>
                      {editingIngredientId === item.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            className="flex-1 min-w-0 px-2 py-1 border rounded text-sm dark:bg-gray-600"
                            value={item.name}
                            onChange={e => updateShoppingItem(item.id, { name: e.target.value })}
                          />
                          <input
                            type="number"
                            min="1"
                            className="w-16 px-2 py-1 border rounded text-sm dark:bg-gray-600"
                            value={item.quantity}
                            onChange={e => updateShoppingItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          />
                          <button onClick={() => saveIngredientEdit(item.id, item.name, item.quantity)} className="text-green-600"><CheckCircle className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <span className="flex-1 text-gray-900 dark:text-white">{item.name}{item.quantity > 1 && ` ×${item.quantity}`}</span>
                      )}
                      {/* Edit / Delete buttons */}
                      {editingIngredientId !== item.id && (
                        <>
                          <button onClick={() => setEditingIngredientId(item.id)} className="text-gray-400 hover:text-blue-600 mr-1"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => removeShoppingItem(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Meal Modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add {selectedType} for Day {selectedDay}
              </h3>
              <button
                onClick={() => setShowMealModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {!showCustomForm ? (
              <>
                {/* Template Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Choose from Templates
                    </h4>
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Custom Meal
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getMealTemplates()[selectedType].map(meal => (
                      <div
                        key={meal.id}
                        onClick={() => {
                          setShowCustomForm(true);
                          setCustomMealName(meal.name);
                          setSelectedIngredients(meal.ingredients);
                        }}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">{meal.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {meal.ingredients.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Custom Meal Form */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Create Custom Meal
                    </h4>
                    <button
                      onClick={() => setShowCustomForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Back to Templates
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Meal Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meal Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter meal name (e.g., Chicken Alfredo)"
                        value={customMealName}
                        onChange={(e) => setCustomMealName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                      />
                    </div>
                    
                    {/* Custom Ingredient Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Add Custom Ingredient
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter ingredient name"
                          value={customIngredient}
                          onChange={(e) => setCustomIngredient(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomIngredientToList()}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                        />
                        <button
                          onClick={addCustomIngredientToList}
                          className="px-4 py-2 inline-flex items-center bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {/* Selected Ingredients List */}
                    {selectedIngredients.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Selected Ingredients ({selectedIngredients.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedIngredients.map((ingredient, index) => (
                            <div
                              key={index}
                              className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                            >
                              <span>{ingredient}</span>
                              <button
                                onClick={() => removeIngredient(ingredient)}
                                className="ml-2 text-green-600 hover:text-green-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4">
                      <button
                        onClick={() => {
                          setShowCustomForm(false);
                          setCustomMealName('');
                          setSuggestedIngredients([]);
                          setSelectedIngredients([]);
                          setCustomIngredient('');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addCustomMeal}
                        disabled={!customMealName.trim() || selectedIngredients.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Meal
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && tripId && (
        <ShoppingList 
          tripId={tripId} 
          onClose={() => setShowShoppingList(false)} 
        />
      )}

      {/* Trip Meal Suggestions */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Suggested Meals for {renderTripTypeText(trip.tripType)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Breakfast</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {getMealSuggestions(trip.tripType, 'breakfast').map((meal, index) => (
                <li key={index}>{meal}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lunch</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {getMealSuggestions(trip.tripType, 'lunch').map((meal, index) => (
                <li key={index}>{meal}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dinner</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {getMealSuggestions(trip.tripType, 'dinner').map((meal, index) => (
                <li key={index}>{meal}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Clear Ingredients Confirmation Modal */}
      {showClearIngredientsConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clear Ingredients
              </h3>
              <button
                onClick={() => setShowClearIngredientsConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will remove all custom meals and manually added ingredients from your ingredients list. Template meals will remain unchanged, and ingredients from custom meals will be removed from the shopping list.
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={clearIngredients}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Clear Ingredients
                </button>
                <button
                  onClick={() => setShowClearIngredientsConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {confirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {confirmation}
        </div>
      )}
    </div>
  );
};

export default MealPlanner; 
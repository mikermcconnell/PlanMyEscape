import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Edit3, X, ShoppingCart, Calendar, CheckCircle, RotateCcw, Save, Download, Upload } from 'lucide-react';
import { Meal, Trip, TripType } from '../types';
import type { MealTemplate } from '../types';
import { hybridDataService } from '../services/hybridDataService';
import { getMealTemplates } from '../data/mealTemplates';
import ShoppingList from '../components/ShoppingList';
import { ShoppingItem } from '../types';
// Shopping and packing operations now handled through hybridDataService
import { suggestIngredients } from '../data/recipeSuggestions';
import SEOHead from '../components/SEOHead';
import { tripMealSuggestions } from '../data/tripMealSuggestions';
import { createMealTemplate, loadMealTemplate, filterCompatibleTemplates, getMealTemplateSummary, getTripDuration } from '../utils/templateHelpers';

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
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealIngredients, setEditMealIngredients] = useState<string[]>([]);
  const [deletedIngredients, setDeletedIngredients] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [filterGroupId, setFilterGroupId] = useState<string>('all');

  // Template management state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<MealTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Save on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (meals.length > 0) {
        hybridDataService.saveMeals(tripId, meals).catch(error => {
          console.error('Failed to save meals on unmount:', error);
        });
      }
    };
  }, [tripId, meals]);

  // Track if data has been loaded to prevent re-initialization
  const [hasLoadedMeals, setHasLoadedMeals] = useState(false);

  useEffect(() => {
    const loadMealsAndDeletedIngredients = async () => {
      if (!tripId) {
        console.log(`🔄 [MealPlanner] Skip loading - no tripId provided`);
        return;
      }
      
      console.log(`📥 [MealPlanner] Loading meals and deleted ingredients for trip ${tripId}...`);
      setHasLoadedMeals(false); // Reset loading flag
      
      const [savedMeals, deletedIngredientsArray] = await Promise.all([
        hybridDataService.getMeals(tripId),
        hybridDataService.getDeletedIngredients(tripId)
      ]);
      
      console.log(`📊 [MealPlanner] Loaded ${savedMeals?.length || 0} meals from database`);
      if (savedMeals && savedMeals.length > 0) {
        console.log(`📝 [MealPlanner] Setting ${savedMeals.length} meals in component state:`, savedMeals.map(m => m.name));
        setMeals(savedMeals);
      } else {
        console.log(`📝 [MealPlanner] No meals found, keeping current state (${meals.length} meals)`);
        setMeals([]);
      }
      
      console.log(`🚫 [MealPlanner] Loaded ${deletedIngredientsArray?.length || 0} deleted ingredients`);
      setDeletedIngredients(new Set(deletedIngredientsArray));
      setHasLoadedMeals(true); // Mark as loaded
    };
    loadMealsAndDeletedIngredients();
  }, [tripId]); // Only depend on tripId, not trip object

  // Load shopping list on mount (only meal-related items for ingredients sidebar)
  useEffect(() => {
    const loadShoppingList = async () => {
      if (!tripId || hasLoadedMeals) return; // Wait for meals to load first
      const savedShoppingList = await hybridDataService.getShoppingItems(tripId);
      // Filter to only show food items that are NOT from packing list
      const mealRelatedItems = savedShoppingList.filter(item => 
        !item.sourceItemId && item.category === 'food'
      );
      setShoppingItems(mealRelatedItems);
    };
    loadShoppingList();
  }, [tripId, hasLoadedMeals]);

  // Trigger shopping list update when meals change
  useEffect(() => {
    if (!tripId || !hasLoadedMeals) return; // Wait for initial load to complete

    console.log('MealPlanner - Meals changed, triggering shopping list refresh...');
    
    // Use the new method that accepts current meals to avoid database reload race conditions
    (async () => {
      const refreshedShoppingItems = await hybridDataService.getShoppingItemsWithMeals(tripId, meals);
      // Filter to only show food items that are NOT from packing list for the ingredients sidebar
      const mealRelatedItems = refreshedShoppingItems.filter(item => 
        !item.sourceItemId && item.category === 'food'
      );
      setShoppingItems(mealRelatedItems);
    })();
  }, [meals, tripId, deletedIngredients, hasLoadedMeals]);

  // Helpers for toggling status
  const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    // Update local ingredients list
    setShoppingItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updates } : it));
    
    // Update global shopping list
    if (tripId) {
      const allItems = await hybridDataService.getShoppingItems(tripId);
      const updatedAllItems = allItems.map(it => it.id === itemId ? { ...it, ...updates } : it);
      await hybridDataService.saveShoppingItems(tripId, updatedAllItems);
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
      await hybridDataService.saveShoppingItems(tripId, updated);
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
      if (tripId) hybridDataService.saveShoppingItems(tripId, updated);
      // Sync to packing list when marked owned
      if (tripId) {
        (async () => {
          const packing = await hybridDataService.getPackingItems(tripId);
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
            await hybridDataService.savePackingItems(tripId, [...packing, newPackingItem]);
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

  const getDateForDay = (day: number) => {
    if (!trip) return '';
    // Parse date as local date to avoid timezone issues
    const dateParts = trip.startDate.split('-');
    if (dateParts.length !== 3) return '';
    const year = parseInt(dateParts[0]!, 10);
    const month = parseInt(dateParts[1]!, 10);
    const dayPart = parseInt(dateParts[2]!, 10);
    if (isNaN(year) || isNaN(month) || isNaN(dayPart)) return '';
    
    const start = new Date(year, month - 1, dayPart); // month is 0-indexed
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + day - 1);
    return dayDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };



  const deleteMeal = async (mealId: string) => {
    const mealToDelete = meals.find(meal => meal.id === mealId);
    console.log(`🗑️ [MealPlanner] Deleting meal: ${mealToDelete?.name} (ID: ${mealId})`);
    console.log(`📊 [MealPlanner] Before deletion - Total meals: ${meals.length}`);
    
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    console.log(`📊 [MealPlanner] After deletion - Total meals: ${updatedMeals.length}`);
    
    setMeals(updatedMeals);
    try {
      // Save immediately for delete operations
      console.log(`💾 [MealPlanner] Saving ${updatedMeals.length} meals to database...`);
      await hybridDataService.saveMeals(tripId, updatedMeals);
      console.log('✅ [MealPlanner] Meal deleted and saved immediately');
      
      // Show success feedback
      setConfirmation(`${mealToDelete?.name || 'Meal'} deleted successfully!`);
      setTimeout(() => setConfirmation(null), 3000);
      
      // The useEffect with [meals] dependency will handle shopping list refresh automatically
    } catch (error) {
      console.error('❌ [MealPlanner] Failed to delete meal:', error);
      // Revert the local state on error
      setMeals(meals);
      setConfirmation('Failed to delete meal. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
    }
  };

  const startEditingMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setEditMealName(meal.name);
    setEditMealIngredients([...meal.ingredients]);
    setShowMealModal(true);
    setShowCustomForm(true);
    setSelectedDay(meal.day);
    setSelectedType(meal.type);
    setCustomMealName(meal.name);
    setSelectedIngredients([...meal.ingredients]);
    setSelectedGroupId(meal.assignedGroupId);
  };

  const saveEditedMeal = async () => {
    if (!editingMeal || !customMealName.trim() || selectedIngredients.length === 0) return;

    const updatedMeals = meals.map(meal =>
      meal.id === editingMeal.id
        ? {
            ...meal,
            name: customMealName.trim(),
            ingredients: selectedIngredients,
            assignedGroupId: selectedGroupId,
            lastModifiedAt: new Date().toISOString()
          }
        : meal
    );

    setMeals(updatedMeals);
    try {
      // Save immediately for edit operations
      await hybridDataService.saveMeals(tripId, updatedMeals);
      console.log('MealPlanner: Meal edited and saved immediately');
    } catch (error) {
      console.error('Failed to save edited meal:', error);
      setConfirmation('Failed to save meal. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
      return;
    }

    // Show success feedback
    setConfirmation(`${customMealName.trim()} updated successfully!`);
    setTimeout(() => setConfirmation(null), 3000);

    // Reset editing state
    setEditingMeal(null);
    setEditMealName('');
    setEditMealIngredients([]);
    setCustomMealName('');
    setSelectedIngredients([]);
    setCustomIngredient('');
    setSelectedGroupId(undefined);
    setShowCustomForm(false);
    setShowMealModal(false);
  };

  const cancelEditingMeal = () => {
    setEditingMeal(null);
    setEditMealName('');
    setEditMealIngredients([]);
    setCustomMealName('');
    setSelectedIngredients([]);
    setCustomIngredient('');
    setSelectedGroupId(undefined);
    setShowCustomForm(false);
    setShowMealModal(false);
  };

  // Template management functions
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templates = await hybridDataService.getMealTemplates();
      const compatibleTemplates = filterCompatibleTemplates(templates, trip.tripType);
      setAvailableTemplates(compatibleTemplates);
    } catch (error) {
      setConfirmation('Failed to load templates. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const saveAsTemplate = async () => {
    if (meals.length === 0) {
      setConfirmation('Cannot save empty meal plan as template');
      setTimeout(() => setConfirmation(null), 3000);
      return;
    }

    setSavingTemplate(true);
    try {
      const tripDuration = getTripDuration(trip.startDate, trip.endDate);
      const template = createMealTemplate(trip.tripName, trip.tripType, tripDuration, meals);
      await hybridDataService.saveMealTemplate(template);
      setConfirmation(`Meal plan saved as "${trip.tripName}" template!`);
      setTimeout(() => setConfirmation(null), 3000);
    } catch (error) {
      setConfirmation('Failed to save template. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
    } finally {
      setSavingTemplate(false);
    }
  };

  const loadTemplate = async (template: MealTemplate) => {
    try {
      const tripDuration = getTripDuration(trip.startDate, trip.endDate);
      const templateMeals = loadMealTemplate(template, tripId, trip, tripDuration);
      const updatedMeals = [...meals, ...templateMeals];
      setMeals(updatedMeals);
      await hybridDataService.saveMeals(tripId, updatedMeals);
      setShowTemplateModal(false);
      setConfirmation(`Loaded "${template.name}" meal plan template!`);
      setTimeout(() => setConfirmation(null), 3000);
    } catch (error) {
      setConfirmation('Failed to load template. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
    }
  };

  const getMealsByType = (day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return meals.filter(meal => {
      const matchesDayAndType = meal.day === day && meal.type === type;
      if (filterGroupId === 'all') return matchesDayAndType;
      return matchesDayAndType && meal.assignedGroupId === filterGroupId;
    });
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

  const addCustomMeal = async () => {
    if (customMealName.trim() && selectedIngredients.length > 0) {
      const newMeal = {
        id: crypto.randomUUID(),
        name: customMealName.trim(),
        day: selectedDay,
        type: selectedType,
        ingredients: selectedIngredients,
        isCustom: true,
        assignedGroupId: selectedGroupId,
        sharedServings: true,
        servings: 1 // Ensure servings is defined
      };
      const updatedMeals = [...meals, newMeal];
      setMeals(updatedMeals);
      try {
        // Save immediately for add operations
        await hybridDataService.saveMeals(tripId, updatedMeals);
        console.log('MealPlanner: Meal added and saved immediately');
      } catch (error) {
        console.error('Failed to add custom meal:', error);
        setConfirmation('Failed to add meal. Please try again.');
        setTimeout(() => setConfirmation(null), 3000);
        return;
      }
      
      // Show success feedback
      setConfirmation(`${customMealName.trim()} added to ingredients list!`);
      setTimeout(() => setConfirmation(null), 3000);
      
      // Reset form
      setCustomMealName('');
      setSuggestedIngredients([]);
      setSelectedIngredients([]);
      setCustomIngredient('');
      setSelectedGroupId(undefined);
      setShowCustomForm(false);
      setShowMealModal(false);
    }
  };



  const addCustomIngredientToList = () => {
    if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
      setSelectedIngredients(prev => [...prev, customIngredient.trim()]);
      if (editingMeal) {
        setEditMealIngredients(prev => [...prev, customIngredient.trim()]);
      }
      setCustomIngredient('');
    }
  };

  // Remove ingredient from suggestion list (during custom meal creation)
  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
    if (editingMeal) {
      setEditMealIngredients(prev => prev.filter(i => i !== ingredient));
    }
  };

  // Remove item from ingredients list sidebar
  const removeShoppingItem = async (itemId: string) => {
    // Find the item being deleted to track its name
    const itemToDelete = shoppingItems.find(i => i.id === itemId);
    
    // Remove from local ingredients list
    setShoppingItems(prev => prev.filter(i => i.id !== itemId));
    
    // Track this ingredient as manually deleted and persist it
    if (itemToDelete && !itemToDelete.sourceItemId) {
      const newDeletedIngredients = new Set(deletedIngredients).add(itemToDelete.name.toLowerCase());
      setDeletedIngredients(newDeletedIngredients);
      
      // PERSIST THE DELETED INGREDIENTS
      await hybridDataService.saveDeletedIngredients(tripId, Array.from(newDeletedIngredients));
    }
    
    // Remove from global shopping list
    if (tripId) {
      const allItems = await hybridDataService.getShoppingItems(tripId);
      const updated = allItems.filter(i => i.id !== itemId);
      await hybridDataService.saveShoppingItems(tripId, updated);
    }
  };

  const addIngredient = async () => {
    if (!newIngredientName.trim()) return;
    const ingredientName = newIngredientName.trim();
    
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: ingredientName,
      quantity: newIngredientQty,
      category: 'food',
      isChecked: false,
      needsToBuy: true,
      isOwned: false,
      sourceItemId: undefined
    };
    
    // Remove from deleted ingredients list if it was previously deleted
    const newDeletedIngredients = new Set(deletedIngredients);
    newDeletedIngredients.delete(ingredientName.toLowerCase());
    setDeletedIngredients(newDeletedIngredients);
    
    // PERSIST THE UPDATED DELETED INGREDIENTS
    await hybridDataService.saveDeletedIngredients(tripId, Array.from(newDeletedIngredients));
    
    // Add to local ingredients list
    setShoppingItems(prev => [...prev, newItem]);
    
    // Add to global shopping list
    if (tripId) {
      const allItems = await hybridDataService.getShoppingItems(tripId);
      const updated = [...allItems, newItem];
      await hybridDataService.saveShoppingItems(tripId, updated);
    }
    
    setNewIngredientName('');
    setNewIngredientQty(1);
  };

  const clearIngredients = async () => {
    // Clear all meals - both custom meals and template meals added by user
    const clearedMeals: Meal[] = [];
    console.log(`🧹 [MealPlanner] Clearing all ${meals.length} meals...`);
    
    setMeals(clearedMeals);
    try {
      console.log('💾 [MealPlanner] Attempting to save empty meals array to database...');
      await hybridDataService.saveMeals(tripId, clearedMeals);
      console.log('✅ [MealPlanner] All meals cleared and saved to database');
      
      // Verify the save worked by reloading from database after a small delay
      console.log('🔍 [MealPlanner] Waiting briefly then verifying meals were cleared...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for database consistency
      const verifyMeals = await hybridDataService.getMeals(tripId);
      console.log(`📊 [MealPlanner] Verification: ${verifyMeals.length} meals found in database after clear`);
      
      if (verifyMeals.length > 0) {
        console.error(`❌ [MealPlanner] Clear verification failed! Found ${verifyMeals.length} meals still in database:`, verifyMeals);
        setConfirmation(`Clear failed: ${verifyMeals.length} meals still exist. Please try again.`);
        setTimeout(() => setConfirmation(null), 5000);
        // Restore the meals that are still in the database
        setMeals(verifyMeals);
        return;
      } else {
        console.log('✅ [MealPlanner] Clear verification successful - no meals found in database');
        setConfirmation('All meals cleared successfully!');
        setTimeout(() => setConfirmation(null), 3000);
      }
    } catch (error) {
      console.error('❌ [MealPlanner] Failed to clear meals:', error);
      setConfirmation('Failed to clear meals. Please try again.');
      setTimeout(() => setConfirmation(null), 3000);
      return;
    }
    
    // Clear the deleted ingredients list since we're clearing everything
    setDeletedIngredients(new Set());
    await hybridDataService.saveDeletedIngredients(tripId, []);
    
    // Force refresh the shopping list using the cleaned meals to avoid race conditions
    console.log('🔄 [MealPlanner] Force refreshing shopping list after clearing meals...');
    const refreshedShoppingItems = await hybridDataService.getShoppingItemsWithMeals(tripId, clearedMeals);
    const mealRelatedItems = refreshedShoppingItems.filter(item => 
      !item.sourceItemId && item.category === 'food'
    );
    setShoppingItems(mealRelatedItems);
    console.log(`🛒 [MealPlanner] Shopping list refreshed: ${mealRelatedItems.length} meal-related items`);
    
    setShowClearIngredientsConfirmation(false);
  };

  const saveIngredientEdit = async (itemId: string, name: string, qty: number) => {
    // Update local ingredients list
    setShoppingItems(prev => prev.map(i => i.id === itemId ? { ...i, name, quantity: qty } : i));
    
    // Update global shopping list
    if (tripId) {
      const allItems = await hybridDataService.getShoppingItems(tripId);
      const updated = allItems.map(i => i.id === itemId ? { ...i, name, quantity: qty } : i);
      await hybridDataService.saveShoppingItems(tripId, updated);
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
    setSelectedGroupId(undefined);
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
      <SEOHead 
        title={`Meal Planner - ${trip.tripName} | PlanMyEscape`}
        description={`Plan delicious camping meals for ${trip.tripName}. Get recipe suggestions, create shopping lists, and organize group meal planning.`}
        keywords="camping meal planning, outdoor cooking, camping recipes, meal prep, group meal planning"
        url={`https://planmyescape.ca/trip/${trip.id}/meals`}
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            {trip.groups.length > 1 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                ✓ Group meal assignments enabled - assign meals to specific groups
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => {
                loadTemplates();
                setShowTemplateModal(true);
              }}
              disabled={loadingTemplates}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingTemplates ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  Load a Meal Plan
                </>
              )}
            </button>
            <button
              onClick={saveAsTemplate}
              disabled={savingTemplate || meals.length === 0}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {savingTemplate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1 sm:mr-2" />
                  Save This Meal Plan
                </>
              )}
            </button>
          </div>
        </div>
        {trip.groups.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Group
            </label>
            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
            >
              <option value="all">All Groups</option>
              {trip.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.size} {group.size === 1 ? 'person' : 'people'})
                </option>
              ))}
            </select>
          </div>
        )}
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
                    Day {day} - {getDateForDay(day)}
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
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {meal.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {meal.ingredients.join(', ')}
                                  </div>
                                  {meal.assignedGroupId && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                        <span className="font-semibold">Responsible: {trip.groups.find(g => g.id === meal.assignedGroupId)?.name}</span>
                                      </span>
                                    </div>
                                  )}
                                  {!meal.assignedGroupId && trip.groups.length > 1 && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                                        Shared by all groups
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => startEditingMeal(meal)}
                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Edit meal"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteMeal(meal.id)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Delete meal"
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
              <div className="mb-4 space-y-2 sm:space-y-0">
                {/* Mobile: Stacked Layout */}
                <div className="block sm:hidden space-y-2">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={newIngredientName}
                    onChange={e => setNewIngredientName(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm dark:bg-gray-700"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={newIngredientQty}
                      onChange={e => setNewIngredientQty(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-2 border rounded text-sm dark:bg-gray-700"
                      placeholder="Qty"
                    />
                    <button
                      onClick={addIngredient}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Add Ingredient
                    </button>
                  </div>
                </div>
                
                {/* Desktop: Horizontal Layout */}
                <div className="hidden sm:flex space-x-2">
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
                    <div key={item.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden space-y-2">
                        {/* Top row: Status buttons and item name */}
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
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
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                className="flex-1 min-w-0 px-2 py-1 border rounded text-sm dark:bg-gray-600"
                                value={item.name}
                                onChange={e => updateShoppingItem(item.id, { name: e.target.value })}
                              />
                              <input
                                type="number"
                                min="1"
                                className="w-12 px-1 py-1 border rounded text-sm dark:bg-gray-600"
                                value={item.quantity}
                                onChange={e => updateShoppingItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                              />
                              <button onClick={() => saveIngredientEdit(item.id, item.name, item.quantity)} className="text-green-600 p-1">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="flex-1 text-gray-900 dark:text-white text-sm">
                              {item.name}{item.quantity > 1 && ` ×${item.quantity}`}
                            </span>
                          )}
                          
                          {editingIngredientId !== item.id && (
                            <div className="flex items-center space-x-1">
                              <button onClick={() => setEditingIngredientId(item.id)} className="text-gray-400 hover:text-blue-600 p-1">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => removeShoppingItem(item.id)} className="text-gray-400 hover:text-red-600 p-1">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center">
                        {/* Status buttons */}
                        <div className="flex items-center space-x-2 mr-3">
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
                            <button onClick={() => saveIngredientEdit(item.id, item.name, item.quantity)} className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="flex-1 text-gray-900 dark:text-white">{item.name}{item.quantity > 1 && ` ×${item.quantity}`}</span>
                        )}
                        {/* Edit / Delete buttons */}
                        {editingIngredientId !== item.id && (
                          <>
                            <button onClick={() => setEditingIngredientId(item.id)} className="text-gray-400 hover:text-blue-600 mr-1">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => removeShoppingItem(item.id)} className="text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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
                {editingMeal ? 'Edit' : 'Add'} {selectedType} for Day {selectedDay} - {getDateForDay(selectedDay)}
              </h3>
              <button
                onClick={editingMeal ? cancelEditingMeal : () => setShowMealModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {!showCustomForm && !editingMeal ? (
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
                    
                    {/* Group Assignment */}
                    {trip.groups.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Assign to Group (Optional)
                        </label>
                        <select
                          value={selectedGroupId || ''}
                          onChange={(e) => setSelectedGroupId(e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                        >
                          <option value="">All Groups (Shared)</option>
                          {trip.groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.size} {group.size === 1 ? 'person' : 'people'})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Leave unassigned for meals shared by all groups
                        </p>
                      </div>
                    )}
                    
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
                        onClick={editingMeal ? cancelEditingMeal : () => {
                          setShowCustomForm(false);
                          setCustomMealName('');
                          setSuggestedIngredients([]);
                          setSelectedIngredients([]);
                          setCustomIngredient('');
                          setSelectedGroupId(undefined);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={editingMeal ? saveEditedMeal : addCustomMeal}
                        disabled={!customMealName.trim() || selectedIngredients.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingMeal ? 'Save Changes' : 'Add Meal'}
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
          groups={trip.groups}
          onClose={() => setShowShoppingList(false)} 
        />
      )}

      {/* Group Meal Responsibilities Summary */}
      {trip.groups.length > 1 && meals.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Group Meal Responsibilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.groups.map(group => {
              const groupMeals = meals.filter(meal => meal.assignedGroupId === group.id);
              return (
                <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {group.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {group.size} {group.size === 1 ? 'person' : 'people'}
                  </p>
                  <div className="space-y-1">
                    {groupMeals.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No meals assigned</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {groupMeals.length} {groupMeals.length === 1 ? 'meal' : 'meals'} assigned
                        </p>
                        {groupMeals.slice(0, 3).map(meal => (
                          <p key={meal.id} className="text-sm text-gray-600 dark:text-gray-400">
                            • Day {meal.day} {meal.type}: {meal.name}
                          </p>
                        ))}
                        {groupMeals.length > 3 && (
                          <p className="text-sm text-gray-400 italic">
                            ...and {groupMeals.length - 3} more
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Shared meals section */}
            {meals.filter(meal => !meal.assignedGroupId).length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Shared Meals
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  All groups together
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {meals.filter(meal => !meal.assignedGroupId).length} shared {meals.filter(meal => !meal.assignedGroupId).length === 1 ? 'meal' : 'meals'}
                  </p>
                  {meals.filter(meal => !meal.assignedGroupId).slice(0, 3).map(meal => (
                    <p key={meal.id} className="text-sm text-gray-600 dark:text-gray-400">
                      • Day {meal.day} {meal.type}: {meal.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
                This will remove all meals from your meal plan and clear all ingredients from your ingredients list. All meal-related items will be removed from the shopping list. You can start fresh by adding new meals.
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Load Meal Plan Template
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a meal plan template to add to your current plan. Meals from the template will be added to your existing meals.
            </p>
            
            {availableTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No compatible templates found</p>
                <p className="text-sm text-gray-500">
                  Create your first template by planning meals and clicking "Save This Meal Plan"
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {template.tripType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {getMealTemplateSummary(template)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => loadTemplate(template)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Load Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
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
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, X, ShoppingCart, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Meal, Trip, TripType } from '../types';
import { getMeals, saveMeals } from '../utils/storage';
import { getMealTemplates, getShoppingList as getMealShoppingList } from '../data/mealTemplates';
import ShoppingList from '../components/ShoppingList';
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
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMealName, setCustomMealName] = useState('');
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');

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

  const addMeal = (meal: Meal) => {
    const newMeal = {
      ...meal,
      day: selectedDay,
      assignedGroupId: undefined,
      sharedServings: true
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
    setShowMealModal(false);
  };

  const deleteMeal = (mealId: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
  };

  const getMealsByType = (day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return meals.filter(meal => meal.day === day && meal.type === type);
  };

  const shoppingList = getMealShoppingList(meals);

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
        sharedServings: true
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

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const addCustomIngredientToList = () => {
    if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
      setSelectedIngredients(prev => [...prev, customIngredient.trim()]);
      setCustomIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
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
                              <div key={meal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
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
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Shopping List
              </h2>
            </div>
            
            <div className="p-6">
              {shoppingList.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Add meals to generate shopping list
                </div>
              ) : (
                <div className="space-y-2">
                  {shoppingList.map((item, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-900 dark:text-white">{item}</span>
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
                        onClick={() => addMeal(meal)}
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
                    
                    {/* Suggested Ingredients */}
                    {suggestedIngredients.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Suggested Ingredients (click to add)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {suggestedIngredients.map((ingredient, index) => (
                            <button
                              key={index}
                              onClick={() => toggleIngredient(ingredient)}
                              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                selectedIngredients.includes(ingredient)
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {ingredient}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
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
    </div>
  );
};

export default MealPlanner; 
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, Save, X, Utensils, ShoppingCart, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Meal, Trip, ShoppingItem, MealType, TripType } from '../types';
import { getMeals, saveMeals, getTrips, addToShoppingList, getShoppingList as getShoppingListFromStorage } from '../utils/storage';
import { getMealTemplates, getShoppingList as getMealShoppingList, createCustomMeal } from '../data/mealTemplates';
import ShoppingList from '../components/ShoppingList';
import { mealSuggestions, suggestIngredients } from '../data/recipeSuggestions';
import { tripMealSuggestions } from '../data/tripMealSuggestions';

type RouteParams = {
  tripId: string;
};

const MealPlanner = () => {
  const { tripId } = useParams<RouteParams>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedType, setSelectedType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customMealName, setCustomMealName] = useState('');
  const [servings, setServings] = useState<number>(1);
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([]);

  const calculateTotalServings = (trip: Trip): number => {
    return trip.groups.reduce((sum, group) => sum + group.size, 0);
  };

  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) return;
      
      const trips = await getTrips();
      const currentTrip = trips.find(t => t.id === tripId);
      setTrip(currentTrip || null);
    };
    loadTrip();
  }, [tripId]);

  useEffect(() => {
    const loadMeals = async () => {
      if (!tripId || !trip) return;
      
      const savedMeals = await getMeals(tripId);
      if (savedMeals) {
        setMeals(savedMeals);
        const totalServings = calculateTotalServings(trip);
        setServings(totalServings);
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
      servings: servings,
      assignedGroupId: undefined,
      sharedServings: true
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
  };

  const updateMeal = (mealId: string, updates: Partial<Meal>) => {
    const updatedMeals = meals.map(meal =>
      meal.id === mealId ? { ...meal, ...updates } : meal
    );
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
    setEditingMeal(null);
  };

  const deleteMeal = (mealId: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
  };

  const getMealsForDay = (day: number) => {
    return meals.filter(meal => meal.day === day);
  };

  const getMealsByType = (day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return meals.filter(meal => meal.day === day && meal.type === type);
  };

  const shoppingList = getMealShoppingList(meals);
  const shoppingItems = tripId ? getShoppingListFromStorage(tripId) : [];

  const addCustomMeal = () => {
    if (customMealName.trim()) {
      const newMeal = createCustomMeal(customMealName.trim(), selectedType, servings);
      newMeal.day = selectedDay;
      newMeal.assignedGroupId = undefined;
      newMeal.sharedServings = true;
      const updatedMeals = [...meals, newMeal];
      setMeals(updatedMeals);
      if (tripId) saveMeals(tripId, updatedMeals);
      setCustomMealName('');
      setSuggestedIngredients([]);
      setShowAddForm(false);
    }
  };

  const assignMealToGroup = (mealId: string, groupId: string | undefined) => {
    const updatedMeals = meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          assignedGroupId: groupId,
          sharedServings: !groupId // If assigned to a group, it's not shared
        };
      }
      return meal;
    });
    setMeals(updatedMeals);
    if (tripId) saveMeals(tripId, updatedMeals);
  };

  const renderMealList = (type: MealType, meals: Meal[]) => {
    const assignedGroup = (meal: Meal) => 
      trip?.groups.find(g => g.id === meal.assignedGroupId);

    return (
      <div className="space-y-2">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{meal.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({meal.servings} {meal.servings === 1 ? 'serving' : 'servings'})
                </span>
              </div>
              {meal.ingredients.length > 0 && (
                <div className="mt-1 text-sm text-gray-500">
                  {meal.ingredients.join(', ')}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {trip?.isCoordinated && (
                <select
                  value={meal.assignedGroupId || ''}
                  onChange={(e) => assignMealToGroup(meal.id, e.target.value || undefined)}
                  className="text-sm border rounded-md py-1 px-2 dark:bg-gray-700"
                  style={{
                    borderColor: assignedGroup(meal)?.color || 'transparent',
                    color: assignedGroup(meal)?.color
                  }}
                >
                  <option value="">Shared</option>
                  {trip?.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => deleteMeal(meal.id)}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalPeople = trip?.groups.reduce((total, group) => total + group.size, 0) || 0;

  const getMealSuggestions = (type: TripType, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return tripMealSuggestions[type][mealType];
  };

  const renderTripTypeText = (type: TripType) => {
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

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Trip not found</h3>
          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const days = getDaysArray();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Meal Planner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {trip.tripName} • {renderTripTypeText(trip.tripType)} • 
              {totalPeople} {totalPeople === 1 ? 'person' : 'people'} total
            </p>
            {trip.isCoordinated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Meals can be assigned to specific groups
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
              to={`/packing-list/${tripId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Packing List
            </Link>
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

      {/* Add Meal Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Meal name"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
              />
              <div className="flex space-x-2">
                <button
                  onClick={addCustomMeal}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setCustomMealName('');
                    setSuggestedIngredients([]);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            {/* Suggested Ingredients */}
            {suggestedIngredients.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Ingredients:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedIngredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Meal Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Custom Meal
        </button>
      )}

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
                            onClick={() => {
                              setSelectedDay(day);
                              setSelectedType(mealType);
                              setShowTemplateModal(true);
                            }}
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
                                    onClick={() => setEditingMeal(meal.id)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
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

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add {selectedType} for Day {selectedDay}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
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
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && tripId && (
        <ShoppingList 
          tripId={tripId} 
          onClose={() => setShowShoppingList(false)} 
        />
      )}

      <div>
        {trip && (
          <div>
            <h3>Suggested Meals for {trip.tripType}</h3>
            <div>
              <h4>Breakfast</h4>
              <ul>
                {getMealSuggestions(trip.tripType, 'breakfast').map((meal, index) => (
                  <li key={index}>{meal}</li>
                ))}
              </ul>
              <h4>Lunch</h4>
              <ul>
                {getMealSuggestions(trip.tripType, 'lunch').map((meal, index) => (
                  <li key={index}>{meal}</li>
                ))}
              </ul>
              <h4>Dinner</h4>
              <ul>
                {getMealSuggestions(trip.tripType, 'dinner').map((meal, index) => (
                  <li key={index}>{meal}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner; 
import { RecipeSuggestion, TripTypeOption } from '../types';

export const recipeSuggestions: Record<string, RecipeSuggestion> = {
  'Chili': {
    name: 'Camping Chili',
    baseIngredients: [
      'Ground beef',
      'Kidney beans',
      'Diced tomatoes',
      'Onion',
      'Garlic',
      'Chili powder',
      'Cumin',
      'Salt',
      'Pepper'
    ],
    optionalIngredients: [
      'Bell peppers',
      'Corn',
      'Shredded cheese',
      'Sour cream',
      'Tortilla chips',
      'Hot sauce'
    ],
    instructions: 'Brown meat, add onions and garlic, then add remaining ingredients and simmer.',
    prepTime: 15,
    cookTime: 45,
    difficulty: 'easy',
    cookingMethod: ['Dutch oven', 'Large pot'],
    servings: 4
  },
  'Mac and Cheese': {
    name: 'Campfire Mac and Cheese',
    baseIngredients: [
      'Macaroni pasta',
      'Cheddar cheese',
      'Butter',
      'Milk',
      'Salt',
      'Pepper'
    ],
    optionalIngredients: [
      'Breadcrumbs',
      'Bacon bits',
      'Diced tomatoes',
      'Green onions'
    ],
    instructions: 'Cook pasta, drain, add butter and cheese, stir until melted, add milk to desired consistency.',
    prepTime: 10,
    cookTime: 20,
    difficulty: 'easy',
    cookingMethod: ['Pot', 'Camp stove'],
    servings: 4
  },
  'Breakfast Skillet': {
    name: 'Camping Breakfast Skillet',
    baseIngredients: [
      'Eggs',
      'Potatoes',
      'Onion',
      'Bell pepper',
      'Sausage',
      'Cheese',
      'Salt',
      'Pepper'
    ],
    optionalIngredients: [
      'Mushrooms',
      'Spinach',
      'Hot sauce',
      'Tortillas',
      'Salsa'
    ],
    instructions: 'Cook potatoes and sausage, add vegetables, then eggs, top with cheese.',
    prepTime: 15,
    cookTime: 25,
    difficulty: 'medium',
    cookingMethod: ['Cast iron skillet', 'Camp stove'],
    servings: 4
  },
  'Foil Packet Fish': {
    name: 'Foil Packet Fish',
    baseIngredients: [
      'Fish fillets',
      'Lemon',
      'Butter',
      'Garlic',
      'Salt',
      'Pepper',
      'Aluminum foil'
    ],
    optionalIngredients: [
      'Fresh herbs',
      'White wine',
      'Cherry tomatoes',
      'Zucchini',
      'Asparagus'
    ],
    instructions: 'Place fish and ingredients in foil packet, seal well, cook on grill or campfire.',
    prepTime: 10,
    cookTime: 15,
    difficulty: 'easy',
    cookingMethod: ['Campfire', 'Grill'],
    servings: 2
  },
  'Dutch Oven Pizza': {
    name: 'Camp Dutch Oven Pizza',
    baseIngredients: [
      'Pizza dough',
      'Pizza sauce',
      'Mozzarella cheese',
      'Italian seasoning',
      'Olive oil'
    ],
    optionalIngredients: [
      'Pepperoni',
      'Mushrooms',
      'Bell peppers',
      'Onions',
      'Olives',
      'Sausage'
    ],
    instructions: 'Oil dutch oven, spread dough, add toppings, cover and cook with coals above and below.',
    prepTime: 20,
    cookTime: 25,
    difficulty: 'medium',
    cookingMethod: ['Dutch oven'],
    servings: 4
  }
};

type MealType = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
};

type MealSuggestions = Record<TripTypeOption, MealType>;

export const mealSuggestions: MealSuggestions = {
  'car camping': {
    breakfast: ["Oatmeal", "Pancakes", "Eggs & Bacon", "French Toast", "Hash Browns"],
    lunch: ["Sandwiches", "Wraps", "Trail Mix", "Hot Dogs", "Grilled Cheese"],
    dinner: ["Burgers", "Hot Dogs", "Foil Packets", "Chili", "Pasta", "Grilled Meats"]
  },
  'canoe camping': {
    breakfast: ["Instant Oatmeal", "Granola", "Dried Fruit", "Protein Bars", "Instant Coffee"],
    lunch: ["Energy Bars", "Jerky", "Nuts", "Dried Fruit", "Tuna Packets"],
    dinner: ["Dehydrated Meals", "Rice & Beans", "Pasta", "Couscous", "Instant Soups"]
  },
  'hike camping': {
    breakfast: ["Instant Coffee", "Protein Bars", "Dried Fruit", "Instant Oatmeal"],
    lunch: ["Trail Mix", "Jerky", "Energy Bars", "Dried Fruit", "Nuts"],
    dinner: ["Freeze-dried Meals", "Instant Noodles", "Dehydrated Meals"]
  },
  'cottage': {
    breakfast: ["Full English", "Pancakes", "French Toast", "Eggs Benedict", "Breakfast Casserole"],
    lunch: ["BBQ", "Salads", "Grilled Sandwiches", "Soups", "Quiche"],
    dinner: ["Grilled Meats", "Pasta", "Fresh Fish", "Stir Fry", "Roasted Vegetables"]
  },
  'day hike': {
    breakfast: ["Energy Bar", "Fruit"],
    lunch: ["Sandwich", "Trail Mix"],
    dinner: ["Restaurant", "Home Cooked"]
  }
};

export const suggestIngredients = (mealName: string): string[] => {
  // Convert to lowercase and remove special characters for matching
  const normalizedName = mealName.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  // Look for exact or partial matches in recipe suggestions
  const match = Object.entries(recipeSuggestions).find(([key]) =>
    key.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(key.toLowerCase())
  );

  if (match) {
    return [...match[1].baseIngredients];
  }

  // Basic ingredient suggestions for common meal types
  if (normalizedName.includes('soup')) {
    return ['Broth', 'Vegetables', 'Noodles', 'Salt', 'Pepper', 'Garlic'];
  }
  if (normalizedName.includes('sandwich')) {
    return ['Bread', 'Meat', 'Cheese', 'Lettuce', 'Tomato', 'Mayo', 'Mustard'];
  }
  if (normalizedName.includes('pasta')) {
    return ['Pasta', 'Sauce', 'Garlic', 'Olive oil', 'Parmesan cheese', 'Salt', 'Pepper'];
  }
  if (normalizedName.includes('salad')) {
    return ['Lettuce', 'Tomatoes', 'Cucumber', 'Dressing', 'Croutons'];
  }
  if (normalizedName.includes('stir fry')) {
    return ['Rice', 'Vegetables', 'Protein', 'Soy sauce', 'Oil', 'Garlic'];
  }

  // Default basic ingredients for unknown meals
  return ['Please specify ingredients'];
}; 
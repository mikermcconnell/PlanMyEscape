import { TripTypeOption } from '../types';

type MealType = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
};

type MealSuggestions = Record<TripTypeOption, MealType>;

export const tripMealSuggestions: MealSuggestions = {
  'car camping': {
    breakfast: [
      'Pancakes with maple syrup',
      'Bacon and eggs',
      'Oatmeal with fruits',
      'French toast',
      'Breakfast burritos'
    ],
    lunch: [
      'Sandwiches',
      'Wraps',
      'Hot dogs',
      'Grilled cheese',
      'Soup and crackers'
    ],
    dinner: [
      'Grilled burgers',
      'Foil packet meals',
      'Pasta with sauce',
      'Chili',
      'Grilled chicken'
    ]
  },
  'canoe camping': {
    breakfast: [
      'Instant oatmeal',
      'Granola with powdered milk',
      'Breakfast bars',
      'Instant coffee',
      'Dried fruits'
    ],
    lunch: [
      'Trail mix',
      'Energy bars',
      'Jerky',
      'Hard cheese and crackers',
      'Dried fruits'
    ],
    dinner: [
      'Dehydrated meals',
      'Rice and beans',
      'Instant noodles',
      'Couscous',
      'Dried soup mix'
    ]
  },
  'hike camping': {
    breakfast: [
      'Instant oatmeal',
      'Protein bars',
      'Granola',
      'Instant coffee',
      'Dried fruits'
    ],
    lunch: [
      'Trail mix',
      'Energy bars',
      'Jerky',
      'Nuts and dried fruits',
      'Peanut butter wraps'
    ],
    dinner: [
      'Dehydrated meals',
      'Instant noodles',
      'Quick rice',
      'Soup mix',
      'Instant mashed potatoes'
    ]
  },
  'cottage': {
    breakfast: [
      'Full English breakfast',
      'Pancakes and waffles',
      'Eggs Benedict',
      'Fresh fruit smoothies',
      'Breakfast casserole'
    ],
    lunch: [
      'Grilled sandwiches',
      'Fresh salads',
      'Quiche',
      'Soup and bread',
      'Deli platters'
    ],
    dinner: [
      'BBQ ribs',
      'Roast chicken',
      'Fresh fish',
      'Pasta dishes',
      'Stir fry'
    ]
  },
  'day hike': {
    breakfast: [
      'Energy Bar',
      'Fruit',
      'Yogurt',
      'Smoothie',
      'Oatmeal'
    ],
    lunch: [
      'Sandwich',
      'Trail Mix',
      'Wrap',
      'Fruit',
      'Salad'
    ],
    dinner: [
      'Restaurant',
      'Home Cooked',
      'Takeout',
      'Pizza',
      'Burgers'
    ]
  }
}; 
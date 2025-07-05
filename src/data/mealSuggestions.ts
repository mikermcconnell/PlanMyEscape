import { TripTypeOption } from '../types';

type MealType = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
};

type MealSuggestions = Record<TripTypeOption, MealType>;

export const mealSuggestions: MealSuggestions = {
  'car camping': {
    breakfast: ["Oatmeal", "Pancakes", "Eggs & Bacon"],
    lunch: ["Sandwiches", "Wraps", "Trail Mix"],
    dinner: ["Burgers", "Hot Dogs", "Foil Packets"]
  },
  'canoe camping': {
    breakfast: ["Instant Oatmeal", "Granola", "Dried Fruit"],
    lunch: ["Energy Bars", "Jerky", "Nuts"],
    dinner: ["Dehydrated Meals", "Rice & Beans", "Pasta"]
  },
  'hike camping': {
    breakfast: ["Instant Coffee", "Protein Bars", "Dried Fruit"],
    lunch: ["Trail Mix", "Jerky", "Energy Bars"],
    dinner: ["Freeze-dried Meals", "Instant Noodles"]
  },
  'cottage': {
    breakfast: ["Full English", "Pancakes", "French Toast"],
    lunch: ["BBQ", "Salads", "Grilled Sandwiches"],
    dinner: ["Grilled Meats", "Pasta", "Fresh Fish", "Stir Fry"]
  }
}; 
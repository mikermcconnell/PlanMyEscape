import { Meal, MealType } from '../types';
import { suggestIngredients } from './recipeSuggestions';

const createMeal = (name: string, type: MealType, ingredients: string[], isCustom: boolean = false): Meal => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name,
  day: 1,
  type,
  ingredients,
  isCustom
});

export const createCustomMeal = (name: string, type: MealType): Meal => {
  const suggestedIngredients = suggestIngredients(name);
  return createMeal(name, type, suggestedIngredients, true);
};

export const getMealTemplates = () => ({
  breakfast: [
    createMeal('Oatmeal with Berries', 'breakfast', ['Oatmeal', 'Dried berries', 'Brown sugar', 'Cinnamon', 'Salt']),
    createMeal('Eggs and Bacon', 'breakfast', ['Eggs', 'Bacon', 'Bread', 'Butter', 'Salt', 'Pepper']),
    createMeal('Pancakes', 'breakfast', ['Pancake mix', 'Eggs', 'Milk', 'Butter', 'Maple syrup', 'Oil']),
    createMeal('Granola with Milk', 'breakfast', ['Granola', 'Powdered milk', 'Dried fruit', 'Nuts', 'Honey']),
    createMeal('Breakfast Burrito', 'breakfast', ['Tortillas', 'Eggs', 'Cheese', 'Sausage', 'Hot sauce', 'Bell peppers', 'Onion']),
    createMeal('Breakfast Skillet', 'breakfast', ['Eggs', 'Potatoes', 'Onion', 'Bell pepper', 'Sausage', 'Cheese', 'Salt', 'Pepper']),
    createMeal('French Toast', 'breakfast', ['Bread', 'Eggs', 'Milk', 'Cinnamon', 'Vanilla extract', 'Butter', 'Maple syrup']),
    createMeal('Yogurt Parfait', 'breakfast', ['Yogurt', 'Granola', 'Honey', 'Fresh berries', 'Nuts']),
    createMeal('Breakfast Sandwich', 'breakfast', ['English muffins', 'Eggs', 'Cheese', 'Ham', 'Butter']),
    createMeal('Hash Browns & Eggs', 'breakfast', ['Frozen hash browns', 'Eggs', 'Cheese', 'Salt', 'Pepper', 'Oil']),
  ],
  lunch: [
    createMeal('Peanut Butter Sandwich', 'lunch', ['Bread', 'Peanut butter', 'Jelly', 'Banana']),
    createMeal('Tuna Sandwich', 'lunch', ['Bread', 'Tuna', 'Mayo', 'Celery', 'Onion', 'Salt', 'Pepper']),
    createMeal('Trail Mix', 'lunch', ['Mixed nuts', 'Dried fruit', 'Chocolate chips', 'Granola', 'Seeds']),
    createMeal('Crackers and Cheese', 'lunch', ['Crackers', 'Cheese', 'Salami', 'Grapes', 'Hummus']),
    createMeal('Hummus and Pita', 'lunch', ['Pita bread', 'Hummus', 'Cucumber', 'Tomatoes', 'Olives']),
    createMeal('Chicken Wrap', 'lunch', ['Tortillas', 'Chicken', 'Lettuce', 'Tomato', 'Mayo', 'Cheese']),
    createMeal('Pasta Salad', 'lunch', ['Pasta', 'Italian dressing', 'Cherry tomatoes', 'Cucumber', 'Olives', 'Cheese']),
    createMeal('Quinoa Bowl', 'lunch', ['Quinoa', 'Black beans', 'Corn', 'Avocado', 'Lime', 'Cilantro']),
    createMeal('Mediterranean Plate', 'lunch', ['Pita bread', 'Hummus', 'Feta cheese', 'Olives', 'Cucumber', 'Tomatoes']),
    createMeal('Cold Cut Sub', 'lunch', ['Sub roll', 'Turkey', 'Ham', 'Cheese', 'Lettuce', 'Tomato', 'Mayo']),
  ],
  dinner: [
    createMeal('Hot Dogs', 'dinner', ['Hot dogs', 'Buns', 'Ketchup', 'Mustard', 'Onion', 'Relish']),
    createMeal('Hamburgers', 'dinner', ['Ground beef', 'Buns', 'Cheese', 'Lettuce', 'Tomato', 'Onion', 'Condiments']),
    createMeal('Pasta with Sauce', 'dinner', ['Pasta', 'Marinara sauce', 'Parmesan cheese', 'Garlic', 'Italian seasoning']),
    createMeal('Camping Chili', 'dinner', ['Ground beef', 'Kidney beans', 'Diced tomatoes', 'Onion', 'Garlic', 'Chili powder', 'Cumin']),
    createMeal('Grilled Chicken', 'dinner', ['Chicken breasts', 'Rice', 'Mixed vegetables', 'Oil', 'Seasonings']),
    createMeal('Foil Packet Fish', 'dinner', ['Fish fillets', 'Lemon', 'Butter', 'Garlic', 'Salt', 'Pepper', 'Aluminum foil']),
    createMeal('Dutch Oven Pizza', 'dinner', ['Pizza dough', 'Pizza sauce', 'Mozzarella cheese', 'Italian seasoning', 'Olive oil']),
    createMeal('Campfire Mac and Cheese', 'dinner', ['Macaroni pasta', 'Cheddar cheese', 'Butter', 'Milk', 'Salt', 'Pepper']),
    createMeal('Stir Fry', 'dinner', ['Rice', 'Mixed vegetables', 'Protein', 'Soy sauce', 'Oil', 'Garlic']),
    createMeal('Fajitas', 'dinner', ['Tortillas', 'Chicken', 'Bell peppers', 'Onion', 'Cheese', 'Salsa', 'Seasonings']),
    createMeal('Beef Stew', 'dinner', ['Beef chunks', 'Potatoes', 'Carrots', 'Onion', 'Beef broth', 'Seasonings']),
    createMeal('Quesadillas', 'dinner', ['Tortillas', 'Cheese', 'Chicken', 'Bell peppers', 'Onion', 'Salsa']),
  ],
  snack: [
    createMeal('Energy Bars', 'snack', ['Assorted energy bars']),
    createMeal('Fresh Fruit', 'snack', ['Apples', 'Oranges', 'Bananas']),
    createMeal('Jerky', 'snack', ['Beef jerky', 'Turkey jerky']),
    createMeal('Trail Mix', 'snack', ['Mixed nuts', 'Dried fruit', 'M&Ms', 'Granola']),
    createMeal('Chips and Dip', 'snack', ['Tortilla chips', 'Salsa', 'Guacamole']),
    createMeal('Cheese and Crackers', 'snack', ['Crackers', 'Cheese', 'Summer sausage']),
    createMeal('Protein Pack', 'snack', ['Hard-boiled eggs', 'Cheese', 'Nuts']),
    createMeal('Sweet Snacks', 'snack', ['Cookies', 'Chocolate', 'Dried fruit']),
    createMeal('Veggie Pack', 'snack', ['Baby carrots', 'Celery', 'Hummus']),
    createMeal('Popcorn', 'snack', ['Microwave popcorn', 'Salt', 'Butter']),
  ]
});

export const getShoppingList = (meals: Meal[]): string[] => {
  const allIngredients = meals.flatMap(meal => meal.ingredients);
  
  const ingredientCounts = allIngredients.reduce((acc, ingredient) => {
    acc[ingredient] = (acc[ingredient] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(ingredientCounts)
    .map(entry => {
      const ingredient = entry[0];
      const count = entry[1] as number;
      return `${ingredient}${count > 1 ? ` (×${count})` : ''}`;
    })
    .sort();
}; 
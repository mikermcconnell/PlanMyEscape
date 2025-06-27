import { Meal, MealType } from '../types';
import { suggestIngredients } from './recipeSuggestions';

const createMeal = (name: string, type: MealType, ingredients: string[], servings: number = 1, isCustom: boolean = false): Meal => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name,
  day: 1,
  type,
  ingredients,
  servings,
  isCustom
});

export const createCustomMeal = (name: string, type: MealType, servings: number = 1): Meal => {
  const suggestedIngredients = suggestIngredients(name);
  return createMeal(name, type, suggestedIngredients, servings, true);
};

export const getMealTemplates = () => ({
  breakfast: [
    createMeal('Oatmeal with Berries', 'breakfast', ['Oatmeal', 'Dried berries', 'Brown sugar', 'Cinnamon', 'Salt'], 1),
    createMeal('Eggs and Bacon', 'breakfast', ['Eggs', 'Bacon', 'Bread', 'Butter', 'Salt', 'Pepper'], 1),
    createMeal('Pancakes', 'breakfast', ['Pancake mix', 'Eggs', 'Milk', 'Butter', 'Maple syrup', 'Oil'], 1),
    createMeal('Granola with Milk', 'breakfast', ['Granola', 'Powdered milk', 'Dried fruit', 'Nuts', 'Honey'], 1),
    createMeal('Breakfast Burrito', 'breakfast', ['Tortillas', 'Eggs', 'Cheese', 'Sausage', 'Hot sauce', 'Bell peppers', 'Onion'], 1),
    createMeal('Breakfast Skillet', 'breakfast', ['Eggs', 'Potatoes', 'Onion', 'Bell pepper', 'Sausage', 'Cheese', 'Salt', 'Pepper'], 2),
    createMeal('French Toast', 'breakfast', ['Bread', 'Eggs', 'Milk', 'Cinnamon', 'Vanilla extract', 'Butter', 'Maple syrup'], 2),
    createMeal('Yogurt Parfait', 'breakfast', ['Yogurt', 'Granola', 'Honey', 'Fresh berries', 'Nuts'], 1),
    createMeal('Breakfast Sandwich', 'breakfast', ['English muffins', 'Eggs', 'Cheese', 'Ham', 'Butter'], 1),
    createMeal('Hash Browns & Eggs', 'breakfast', ['Frozen hash browns', 'Eggs', 'Cheese', 'Salt', 'Pepper', 'Oil'], 2),
  ],
  lunch: [
    createMeal('Peanut Butter Sandwich', 'lunch', ['Bread', 'Peanut butter', 'Jelly', 'Banana'], 1),
    createMeal('Tuna Sandwich', 'lunch', ['Bread', 'Tuna', 'Mayo', 'Celery', 'Onion', 'Salt', 'Pepper'], 1),
    createMeal('Trail Mix', 'lunch', ['Mixed nuts', 'Dried fruit', 'Chocolate chips', 'Granola', 'Seeds'], 2),
    createMeal('Crackers and Cheese', 'lunch', ['Crackers', 'Cheese', 'Salami', 'Grapes', 'Hummus'], 1),
    createMeal('Hummus and Pita', 'lunch', ['Pita bread', 'Hummus', 'Cucumber', 'Tomatoes', 'Olives'], 1),
    createMeal('Chicken Wrap', 'lunch', ['Tortillas', 'Chicken', 'Lettuce', 'Tomato', 'Mayo', 'Cheese'], 1),
    createMeal('Pasta Salad', 'lunch', ['Pasta', 'Italian dressing', 'Cherry tomatoes', 'Cucumber', 'Olives', 'Cheese'], 2),
    createMeal('Quinoa Bowl', 'lunch', ['Quinoa', 'Black beans', 'Corn', 'Avocado', 'Lime', 'Cilantro'], 2),
    createMeal('Mediterranean Plate', 'lunch', ['Pita bread', 'Hummus', 'Feta cheese', 'Olives', 'Cucumber', 'Tomatoes'], 1),
    createMeal('Cold Cut Sub', 'lunch', ['Sub roll', 'Turkey', 'Ham', 'Cheese', 'Lettuce', 'Tomato', 'Mayo'], 1),
  ],
  dinner: [
    createMeal('Hot Dogs', 'dinner', ['Hot dogs', 'Buns', 'Ketchup', 'Mustard', 'Onion', 'Relish'], 1),
    createMeal('Hamburgers', 'dinner', ['Ground beef', 'Buns', 'Cheese', 'Lettuce', 'Tomato', 'Onion', 'Condiments'], 1),
    createMeal('Pasta with Sauce', 'dinner', ['Pasta', 'Marinara sauce', 'Parmesan cheese', 'Garlic', 'Italian seasoning'], 2),
    createMeal('Camping Chili', 'dinner', ['Ground beef', 'Kidney beans', 'Diced tomatoes', 'Onion', 'Garlic', 'Chili powder', 'Cumin'], 4),
    createMeal('Grilled Chicken', 'dinner', ['Chicken breasts', 'Rice', 'Mixed vegetables', 'Oil', 'Seasonings'], 2),
    createMeal('Foil Packet Fish', 'dinner', ['Fish fillets', 'Lemon', 'Butter', 'Garlic', 'Salt', 'Pepper', 'Aluminum foil'], 2),
    createMeal('Dutch Oven Pizza', 'dinner', ['Pizza dough', 'Pizza sauce', 'Mozzarella cheese', 'Italian seasoning', 'Olive oil'], 4),
    createMeal('Campfire Mac and Cheese', 'dinner', ['Macaroni pasta', 'Cheddar cheese', 'Butter', 'Milk', 'Salt', 'Pepper'], 4),
    createMeal('Stir Fry', 'dinner', ['Rice', 'Mixed vegetables', 'Protein', 'Soy sauce', 'Oil', 'Garlic'], 2),
    createMeal('Fajitas', 'dinner', ['Tortillas', 'Chicken', 'Bell peppers', 'Onion', 'Cheese', 'Salsa', 'Seasonings'], 2),
    createMeal('Beef Stew', 'dinner', ['Beef chunks', 'Potatoes', 'Carrots', 'Onion', 'Beef broth', 'Seasonings'], 4),
    createMeal('Quesadillas', 'dinner', ['Tortillas', 'Cheese', 'Chicken', 'Bell peppers', 'Onion', 'Salsa'], 2),
  ],
  snack: [
    createMeal('Energy Bars', 'snack', ['Assorted energy bars'], 1),
    createMeal('Fresh Fruit', 'snack', ['Apples', 'Oranges', 'Bananas'], 1),
    createMeal('Jerky', 'snack', ['Beef jerky', 'Turkey jerky'], 1),
    createMeal('Trail Mix', 'snack', ['Mixed nuts', 'Dried fruit', 'M&Ms', 'Granola'], 2),
    createMeal('Chips and Dip', 'snack', ['Tortilla chips', 'Salsa', 'Guacamole'], 2),
    createMeal('Cheese and Crackers', 'snack', ['Crackers', 'Cheese', 'Summer sausage'], 1),
    createMeal('Protein Pack', 'snack', ['Hard-boiled eggs', 'Cheese', 'Nuts'], 1),
    createMeal('Sweet Snacks', 'snack', ['Cookies', 'Chocolate', 'Dried fruit'], 2),
    createMeal('Veggie Pack', 'snack', ['Baby carrots', 'Celery', 'Hummus'], 1),
    createMeal('Popcorn', 'snack', ['Microwave popcorn', 'Salt', 'Butter'], 2),
  ]
});

export const getShoppingList = (meals: Meal[]): string[] => {
  const allIngredients = meals.flatMap(meal => {
    // Multiply ingredients by servings
    return Array(meal.servings).fill(meal.ingredients).flat();
  });
  
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
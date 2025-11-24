import { PackingSuggestion } from '../types';

// Helper function to separate items with 'and' in their names
export const separateAndItems = (suggestions: PackingSuggestion[]): PackingSuggestion[] => {
  return suggestions.flatMap(item => {
    if (item.name.includes(' and ')) {
      const parts = item.name.split(' and ');
      return parts.map(part => ({ ...item, name: part.trim() }));
    }
    return item;
  });
};

export const activityEquipmentMap: Record<string, PackingSuggestion[]> = {
  'fishing': [
    { name: 'Tackle Box', category: 'Other', required: false },
    { name: 'Bait', category: 'Other', required: false },
    { name: 'Fishing License', category: 'Personal', required: false },
    { name: 'Net', category: 'Other', required: false },
    { name: 'Cooler', category: 'Kitchen', required: false },
    { name: 'Fillet Knife', category: 'Kitchen', required: false }
  ],
  'swimming': [
    { name: 'Swimsuit', category: 'Clothing', required: false },
    { name: 'Beach Towel', category: 'Personal', required: false, quantity: 2 },
    { name: 'Sunscreen', category: 'Personal', required: false },
    { name: 'Goggles', category: 'Other', required: false },
    { name: 'Pool Noodles', category: 'Other', required: false },
    { name: 'Phone Case', category: 'Personal', required: false }
  ],
  'kayaking': [
    { name: 'Life Jacket', category: 'Other', required: false },
    { name: 'Paddle', category: 'Other', required: false },
    { name: 'Dry Bag', category: 'Pack', required: false },
    { name: 'Quick-dry Clothes', category: 'Clothing', required: false },
    { name: 'Map', category: 'Other', required: false },
    { name: 'Bilge Pump', category: 'Tools', required: false }
  ],
  'canoeing': [
    { name: 'Life Jacket', category: 'Other', required: false },
    { name: 'Paddle', category: 'Other', required: false },
    { name: 'Spare Paddle', category: 'Other', required: false },
    { name: 'Dry Bag', category: 'Pack', required: false },
    { name: 'Portage Yoke', category: 'Other', required: false },
    { name: 'Map', category: 'Other', required: false }
  ],

  // Hiking Activities
  'hiking': [
    { name: 'Hiking Boots', category: 'Clothing', required: false },
    { name: 'Day Pack', category: 'Pack', required: false },
    { name: 'Water Bottles', category: 'Kitchen', required: false, quantity: 2 },
    { name: 'Trail Snacks', category: 'Kitchen', required: false },
    { name: 'First Aid Kit', category: 'Personal', required: false },
    { name: 'Map', category: 'Other', required: false },
    { name: 'Compass', category: 'Other', required: false },
    { name: 'Hiking Poles', category: 'Other', required: false },
    { name: 'Rain Jacket', category: 'Clothing', required: false }
  ],
  'nature photography': [
    { name: 'Camera', category: 'Personal', required: false },
    { name: 'Batteries', category: 'Personal', required: false },
    { name: 'Memory Cards', category: 'Personal', required: false },
    { name: 'Tripod', category: 'Other', required: false },
    { name: 'Lens Cleaner', category: 'Personal', required: false },
    { name: 'Camera Bag', category: 'Pack', required: false }
  ],
  'bird watching': [
    { name: 'Binoculars', category: 'Other', required: false },
    { name: 'Field Guide', category: 'Personal', required: false },
    { name: 'Notebook', category: 'Personal', required: false },
    { name: 'Quiet Clothes', category: 'Clothing', required: false },
    { name: 'Chair', category: 'Comfort', required: false }
  ],

  // Campfire & Cooking
  'campfire': [
    { name: 'Firewood', category: 'Other', required: false },
    { name: 'Fire Starter', category: 'Tools', required: false },
    { name: 'Matches', category: 'Tools', required: false },
    { name: 'Lighter', category: 'Tools', required: false },
    { name: 'Chairs', category: 'Comfort', required: false },
    { name: 'Marshmallows', category: 'Kitchen', required: false },
    { name: 'Extinguisher', category: 'Tools', required: false }
  ],
  'bbq': [
    { name: 'Grill', category: 'Kitchen', required: false },
    { name: 'Charcoal', category: 'Kitchen', required: false },
    { name: 'BBQ Tools', category: 'Kitchen', required: false },
    { name: 'Thermometer', category: 'Kitchen', required: false },
    { name: 'Foil', category: 'Kitchen', required: false },
    { name: 'Grill Brush', category: 'Kitchen', required: false }
  ],
  'grilling': [
    { name: 'Grill', category: 'Kitchen', required: false },
    { name: 'Propane Tank', category: 'Kitchen', required: false },
    { name: 'Grill Tools', category: 'Kitchen', required: false },
    { name: 'Cooler', category: 'Kitchen', required: false },
    { name: 'Thermometer', category: 'Kitchen', required: false }
  ],

  // Entertainment & Indoor
  'board games': [
    { name: 'Card Games', category: 'Comfort', required: false },
    { name: 'Board Games', category: 'Comfort', required: false },
    { name: 'Table', category: 'Comfort', required: false },
    { name: 'Lighting', category: 'Other', required: false }
  ],
  'star gazing': [
    { name: 'Blankets', category: 'Comfort', required: false },
    { name: 'Star Chart', category: 'Personal', required: false },
    { name: 'Telescope', category: 'Other', required: false },
    { name: 'Red Flashlight', category: 'Tools', required: false },
    { name: 'Chairs', category: 'Comfort', required: false }
  ],

  // Default suggestions for common activity keywords
  'cycling': [
    { name: 'Helmet', category: 'Other', required: false },
    { name: 'Water Bottles', category: 'Kitchen', required: false },
    { name: 'Repair Kit', category: 'Tools', required: false },
    { name: 'Bike Shorts', category: 'Clothing', required: false }
  ],
  'climbing': [
    { name: 'Climbing Gear', category: 'Other', required: false },
    { name: 'Helmet', category: 'Other', required: false },
    { name: 'Ropes', category: 'Other', required: false },
    { name: 'First Aid Kit', category: 'Personal', required: false }
  ],
  'yoga': [
    { name: 'Yoga mat', category: 'Fun and games', required: false },
    { name: 'Comfortable clothes', category: 'Clothing', required: false },
    { name: 'Water bottle', category: 'Kitchen', required: false },
    { name: 'Towel', category: 'Personal', required: false }
  ]
};

// Function to get equipment suggestions based on activity name
export const getEquipmentSuggestions = (activityName: string): PackingSuggestion[] => {
  const normalizedName = activityName.toLowerCase();

  let suggestions: PackingSuggestion[] = [];

  // Direct match
  if (activityEquipmentMap[normalizedName]) {
    suggestions = activityEquipmentMap[normalizedName] ?? [];
  } else {
    // Partial matches for flexibility
    for (const [key, suggestionsArray] of Object.entries(activityEquipmentMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        suggestions = suggestionsArray;
        break;
      }
    }
  }

  // If no suggestions found, use default
  if (suggestions.length === 0) {
    suggestions = [
      { name: 'Water Bottle', category: 'Kitchen', required: false },
      { name: 'Snacks', category: 'Kitchen', required: false },
      { name: 'First Aid Kit', category: 'Personal', required: false }
    ];
  }

  // Automatically separate items with 'and' in their names
  return separateAndItems(suggestions);
};

// Function to detect activity type based on name
export const detectActivityType = (activityName: string): 'outdoor' | 'indoor' | 'water' | 'entertainment' => {
  const normalizedName = activityName.toLowerCase();

  // Water activities
  if (normalizedName.includes('swim') || normalizedName.includes('fish') ||
    normalizedName.includes('kayak') || normalizedName.includes('canoe') ||
    normalizedName.includes('boat') || normalizedName.includes('water')) {
    return 'water';
  }

  // Indoor activities  
  if (normalizedName.includes('game') || normalizedName.includes('card') ||
    normalizedName.includes('movie') || normalizedName.includes('read')) {
    return 'indoor';
  }

  // Entertainment activities
  if (normalizedName.includes('music') || normalizedName.includes('dance') ||
    normalizedName.includes('party') || normalizedName.includes('trivia')) {
    return 'entertainment';
  }

  // Default to outdoor
  return 'outdoor';
};
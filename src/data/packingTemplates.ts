import { PackingItem, TripType } from '../types';

const createItem = (
  name: string,
  category: string,
  weight?: number,
  quantity: number = 1,
  required: boolean = true
): PackingItem => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  category,
  quantity,
  weight,
  isChecked: false,
  isOwned: false,
  needsToBuy: false,
  isPacked: false,
  required,
  assignedGroupId: undefined
});

export const getCarCampingTemplate = (groupSize: number): PackingItem[] => [
  // Shelter - Required
  createItem('Tent', 'Shelter', undefined, 1, true),
  createItem('Tent poles', 'Shelter', undefined, 1, true),
  createItem('Tent stakes', 'Shelter', undefined, 1, true),
  createItem('Sleeping bag', 'Sleep', 1500, 1, true),
  createItem('Sleeping pad', 'Sleep', 800, 1, true),
  createItem('Emergency blanket', 'Shelter', undefined, 1, true),
  
  // Shelter - Optional
  createItem('Tent footprint', 'Shelter', undefined, 1, false),
  createItem('Tarp', 'Shelter', undefined, 1, false),
  createItem('Pillow', 'Sleep', 300, 1, false),
  createItem('Sleeping bag liner', 'Sleep', 200, 1, false),
  createItem('Tent repair kit', 'Shelter', undefined, 1, false),
  
  // Kitchen - Required
  createItem('Stove', 'Kitchen', undefined, 1, true),
  createItem('Fuel', 'Kitchen', undefined, 1, true),
  createItem('Lighter/matches', 'Kitchen', undefined, 1, true),
  createItem('Cookware set', 'Kitchen', undefined, 1, true),
  createItem('Utensils', 'Kitchen', undefined, 1, true),
  createItem('Water jug', 'Kitchen', undefined, 1, true),
  createItem('Water filter/purification', 'Kitchen', undefined, 1, true),
  createItem('Trash bags', 'Kitchen', undefined, 1, true),
  
  // Kitchen - Optional
  createItem('Plates/bowls', 'Kitchen', undefined, groupSize, false),
  createItem('Cups/mugs', 'Kitchen', undefined, groupSize, false),
  createItem('Cooler', 'Kitchen', undefined, 1, false),
  createItem('Ice', 'Kitchen', undefined, 1, false),
  createItem('Coffee maker', 'Kitchen', undefined, 1, false),
  createItem('Camp sink', 'Kitchen', undefined, 1, false),
  createItem('Dish soap', 'Kitchen', undefined, 1, false),
  createItem('Sponge', 'Kitchen', undefined, 1, false),
  createItem('Can opener', 'Kitchen', undefined, 1, false),
  createItem('Cutting board', 'Kitchen', undefined, 1, false),
  createItem('Aluminum foil', 'Kitchen', undefined, 1, false),
  createItem('Ziploc bags', 'Kitchen', undefined, 1, false),
  createItem('Paper towels', 'Kitchen', undefined, 1, false),
  
  // Clothing - Required
  createItem('Hiking boots', 'Clothing', undefined, 1, true),
  createItem('Hiking socks', 'Clothing', undefined, 2, true),
  createItem('Underwear', 'Clothing', undefined, 2, true),
  createItem('Hiking pants', 'Clothing', undefined, 1, true),
  createItem('Hiking shirts', 'Clothing', undefined, 2, true),
  createItem('Warm jacket', 'Clothing', undefined, 1, true),
  createItem('Rain jacket', 'Clothing', undefined, 1, true),
  createItem('Hat', 'Clothing', undefined, 1, true),
  createItem('Sunglasses', 'Clothing', undefined, 1, true),
  
  // Clothing - Optional
  createItem('Base layers', 'Clothing', undefined, groupSize * 2, false),
  createItem('Gloves', 'Clothing', undefined, 1, false),
  createItem('Swimsuit', 'Clothing', undefined, 1, false),
  createItem('Camp shoes', 'Clothing', undefined, 1, false),
  createItem('Pajamas', 'Clothing', undefined, 1, false),
  createItem('Bandana', 'Clothing', undefined, 1, false),
  createItem('Gaiters', 'Clothing', undefined, 1, false),
  
  // Personal - Required
  createItem('Toothbrush', 'Personal', undefined, 1, true),
  createItem('Toothpaste', 'Personal', undefined, 1, true),
  createItem('Soap', 'Personal', undefined, 1, true),
  createItem('Hand sanitizer', 'Personal', undefined, 1, true),
  createItem('Towel', 'Personal', undefined, 1, true),
  createItem('Sunscreen', 'Personal', undefined, 1, true),
  createItem('Bug spray', 'Personal', undefined, 1, true),
  createItem('First aid kit', 'Personal', undefined, 1, true),
  createItem('Medications', 'Personal', undefined, 1, true),
  createItem('Toilet paper', 'Personal', undefined, 1, true),
  
  // Personal - Optional
  createItem('Deodorant', 'Personal', undefined, 1, false),
  createItem('Hair brush', 'Personal', undefined, 1, false),
  createItem('Contact solution', 'Personal', undefined, 1, false),
  createItem('Lip balm', 'Personal', undefined, 1, false),
  createItem('Baby wipes', 'Personal', undefined, 1, false),
  createItem('Mirror', 'Personal', undefined, 1, false),
  createItem('Ear plugs', 'Personal', undefined, 1, false),
  createItem('Eye mask', 'Personal', undefined, 1, false),
  
  // Tools & Safety - Required
  createItem('Headlamp', 'Tools', undefined, 1, true),
  createItem('Extra batteries', 'Tools', undefined, 1, true),
  createItem('Multi-tool', 'Tools', undefined, 1, true),
  createItem('Duct tape', 'Tools', undefined, 1, true),
  createItem('Rope/cord', 'Tools', undefined, 1, true),
  createItem('Map', 'Tools', undefined, 1, true),
  createItem('Compass', 'Tools', undefined, 1, true),
  createItem('Fire starter', 'Tools', undefined, 1, true),
  createItem('Whistle', 'Tools', undefined, 1, true),
  
  // Tools & Safety - Optional
  createItem('GPS device', 'Tools', undefined, 1, false),
  createItem('Walkie talkies', 'Tools', undefined, 1, false),
  createItem('Power bank', 'Tools', undefined, 1, false),
  createItem('Phone charger', 'Tools', undefined, 1, false),
  createItem('Bear spray', 'Tools', undefined, 1, false),
  createItem('Axe/hatchet', 'Tools', undefined, 1, false),
  createItem('Folding saw', 'Tools', undefined, 1, false),
  
  // Comfort - Optional
  createItem('Camp chairs', 'Comfort', undefined, groupSize, false),
  createItem('Camp table', 'Comfort', undefined, 1, false),
  createItem('Lantern', 'Comfort', undefined, 1, false),
  createItem('Books/games', 'Comfort', undefined, 1, false),
  createItem('Hammock', 'Comfort', undefined, 1, false),
  createItem('Camp shower', 'Comfort', undefined, 1, false),
  createItem('Portable speaker', 'Comfort', undefined, 1, false),
  createItem('Camera', 'Comfort', undefined, 1, false),
  createItem('Binoculars', 'Comfort', undefined, 1, false),
  createItem('Fishing gear', 'Comfort', undefined, 1, false),
];

export const getBackcountryTemplate = (groupSize: number): PackingItem[] => [
  // Shelter - Required
  createItem('Lightweight tent', 'Shelter', 2000, 1, true),
  createItem('Tent poles', 'Shelter', 800, 1, true),
  createItem('Tent stakes', 'Shelter', 200, 1, true),
  createItem('Sleeping bag', 'Sleep', 800, 1, true),
  createItem('Sleeping pad', 'Sleep', 400, 1, true),
  createItem('Emergency blanket', 'Shelter', 100, 1, true), // Added as required
  
  // Shelter - Optional
  createItem('Tent footprint', 'Shelter', 300, 1, false),
  createItem('Pillow', 'Sleep', 150, 1, false),
  createItem('Sleeping bag liner', 'Sleep', 100, 1, false),
  createItem('Tent repair kit', 'Shelter', 50, 1, false),
  createItem('Bivy sack', 'Shelter', 300, 1, false),
  
  // Kitchen - Required
  createItem('Lightweight stove', 'Kitchen', 300, 1, true),
  createItem('Fuel canister', 'Kitchen', 400, 1, true),
  createItem('Lighter', 'Kitchen', 20, 1, true),
  createItem('Pot', 'Kitchen', 400, 1, true),
  createItem('Spork', 'Kitchen', 20, 1, true),
  createItem('Water filter', 'Kitchen', 300, 1, true),
  createItem('Water bottles', 'Kitchen', 500, groupSize * 2, true),
  createItem('Food bag', 'Kitchen', 100, 1, true),
  
  // Kitchen - Optional
  createItem('Bear canister', 'Kitchen', 1000, 1, false),
  createItem('Coffee filter', 'Kitchen', 10, 1, false),
  createItem('Salt/pepper', 'Kitchen', 20, 1, false),
  createItem('Hot sauce', 'Kitchen', 30, 1, false),
  createItem('Cup', 'Kitchen', 100, 1, false),
  createItem('Bowl', 'Kitchen', 150, 1, false),
  createItem('Food storage bag', 'Kitchen', 50, 1, false),
  
  // Clothing - Required
  createItem('Hiking boots', 'Clothing', 800, 1, true),
  createItem('Hiking socks', 'Clothing', 100, 2, true), // Reduced quantity
  createItem('Underwear', 'Clothing', 50, 2, true), // Reduced quantity
  createItem('Hiking pants', 'Clothing', 300, 1, true), // Reduced quantity
  createItem('Hiking shirts', 'Clothing', 200, 2, true), // Reduced quantity
  createItem('Warm jacket', 'Clothing', 400, 1, true),
  createItem('Rain jacket', 'Clothing', 300, 1, true),
  createItem('Warm hat', 'Clothing', 100, 1, true),
  createItem('Sunglasses', 'Clothing', 50, 1, true), // Moved from optional to required
  
  // Clothing - Optional
  createItem('Base layers', 'Clothing', 200, groupSize * 2, false),
  createItem('Gloves', 'Clothing', 100, 1, false),
  createItem('Swimsuit', 'Clothing', 100, 1, false),
  createItem('Camp shoes', 'Clothing', 300, 1, false),
  createItem('Pajamas', 'Clothing', 200, 1, false),
  createItem('Bandana', 'Clothing', 30, 1, false),
  createItem('Gaiters', 'Clothing', 200, 1, false),
  createItem('Rain pants', 'Clothing', 250, 1, false),
  createItem('Puffy jacket', 'Clothing', 350, 1, false),
  
  // Personal - Required
  createItem('Toothbrush', 'Personal', 20, 1, true),
  createItem('Toothpaste', 'Personal', 50, 1, true),
  createItem('Biodegradable soap', 'Personal', 100, 1, true),
  createItem('Hand sanitizer', 'Personal', 50, 1, true), // Moved from optional to required
  createItem('Small towel', 'Personal', 100, 1, true),
  createItem('Sunscreen', 'Personal', 100, 1, true),
  createItem('Bug spray', 'Personal', 100, 1, true),
  createItem('First aid kit', 'Personal', 300, 1, true),
  createItem('Medications', 'Personal', undefined, 1, true),
  createItem('Toilet paper', 'Personal', 50, 1, true),
  
  // Personal - Optional
  createItem('Deodorant', 'Personal', 50, 1, false),
  createItem('Lip balm', 'Personal', 20, 1, false),
  createItem('Baby wipes', 'Personal', 100, 1, false),
  createItem('Mirror', 'Personal', 30, 1, false),
  createItem('Ear plugs', 'Personal', 10, 1, false),
  createItem('Eye mask', 'Personal', 20, 1, false),
  createItem('Contact solution', 'Personal', 100, 1, false),
  createItem('Hair brush', 'Personal', 50, 1, false),
  
  // Tools & Safety - Required
  createItem('Headlamp', 'Tools', 100, 1, true),
  createItem('Extra batteries', 'Tools', 50, 1, true),
  createItem('Multi-tool', 'Tools', 100, 1, true),
  createItem('Duct tape', 'Tools', 50, 1, true),
  createItem('Paracord', 'Tools', 100, 1, true),
  createItem('Map', 'Tools', 50, 1, true),
  createItem('Compass', 'Tools', 50, 1, true),
  createItem('Fire starter', 'Tools', 50, 1, true),
  createItem('Whistle', 'Tools', 20, 1, true), // Added as required
  
  // Tools & Safety - Optional
  createItem('GPS device', 'Tools', 200, 1, false),
  createItem('Walkie talkies', 'Tools', 300, 1, false),
  createItem('Power bank', 'Tools', 200, 1, false),
  createItem('Phone charger', 'Tools', 50, 1, false),
  createItem('Bear spray', 'Tools', 400, 1, false),
  createItem('Axe/hatchet', 'Tools', 800, 1, false),
  createItem('Folding saw', 'Tools', 300, 1, false),
  createItem('Satellite communicator', 'Tools', 150, 1, false),
  
  // Pack - Required
  createItem('Backpack', 'Pack', 1500, 1, true),
  createItem('Pack cover', 'Pack', 200, 1, true),
  createItem('Dry bags', 'Pack', 100, groupSize * 2, true),
  
  // Pack - Optional
  createItem('Pack liner', 'Pack', 50, 1, false),
  createItem('Stuff sacks', 'Pack', 50, groupSize * 3, false),
  createItem('Compression straps', 'Pack', 30, 1, false),
  createItem('Pack repair kit', 'Pack', 50, 1, false),
  
  // Comfort - Optional
  createItem('Camp chair', 'Comfort', 500, 1, false),
  createItem('Books/games', 'Comfort', 200, 1, false),
  createItem('Camera', 'Comfort', 300, 1, false),
  createItem('Binoculars', 'Comfort', 400, 1, false),
  createItem('Fishing gear', 'Comfort', 600, 1, false),
  createItem('Portable speaker', 'Comfort', 200, 1, false),
  createItem('Hammock', 'Comfort', 400, 1, false),
  createItem('Trekking poles', 'Comfort', 300, 1, false),
]; 

interface PackingTemplate {
  essentials: string[];
  recommended: string[];
}

export const packingTemplates: Record<TripType, PackingTemplate> = {
  'car camping': {
    essentials: [
      "Tent",
      "Sleeping bags",
      "Camping chairs",
      "Cooler",
      "Lantern",
      "First aid kit",
      "Water containers",
      "Cooking stove + fuel",
      "Basic tools",
      "Tarp",
      "Camp table",
      "Firewood"
    ],
    recommended: [
      "Extra blankets", 
      "Solar charger",
      "Games/cards",
      "Camp rug",
      "Screen tent",
      "Dutch oven",
      "Hammock",
      "String lights"
    ]
  },
  'canoe camping': {
    essentials: [
      "Lightweight tent",
      "Dry bags",
      "Life jackets (PFDs)",
      "Maps/compass",
      "Water filter",
      "First aid kit",
      "Emergency radio",
      "Rope",
      "Paddles",
      "Bailer/sponge",
      "Waterproof matches",
      "Throw line"
    ],
    recommended: [
      "Emergency shelter",
      "Bear spray",
      "Repair kit",
      "Satellite phone",
      "Canoe cart",
      "Waterproof map case",
      "Paddle float",
      "Extra paddle"
    ]
  },
  'hike camping': {
    essentials: [
      "Ultralight tent",
      "Sleeping bag",
      "Water filter",
      "First aid kit", 
      "Maps/compass",
      "Headlamp",
      "Bear canister",
      "Emergency shelter",
      "Lightweight stove",
      "Trekking poles"
    ],
    recommended: [
      "Satellite device",
      "Repair kit",
      "Microspikes",
      "Emergency bivy",
      "Ultralight chair",
      "Gaiters",
      "Pack cover"
    ]
  },
  'cottage': {
    essentials: [
      "Bedding/linens",
      "Towels",
      "Kitchen supplies",
      "Cleaning supplies",
      "First aid kit",
      "Games/entertainment",
      "Basic tools",
      "Flashlights",
      "Bug spray",
      "Toiletries"
    ],
    recommended: [
      "Fan/heater",
      "Extra chairs",
      "Water toys",
      "Hammock",
      "Bluetooth speaker",
      "Board games",
      "Binoculars",
      "Outdoor games"
    ]
  }
};

export const specializedGear: Record<TripType, string[]> = {
  'car camping': [
    "Large tent",
    "Camp chairs",
    "Large cooler",
    "Propane lantern",
    "Two-burner stove",
    "Screen tent",
    "Camp kitchen setup"
  ],
  'canoe camping': [
    "Water filter",
    "Dry bags",
    "Life jackets", 
    "Maps/compass",
    "Emergency radio",
    "Canoe repair kit",
    "Throw line",
    "Bailer"
  ],
  'hike camping': [
    "Ultralight tent",
    "Bear canister",
    "Water filter",
    "Emergency shelter",
    "Satellite device",
    "Trekking poles",
    "Ultralight stove"
  ],
  'cottage': [
    "Bedding/linens",
    "Kitchen supplies",
    "Entertainment items",
    "Cleaning supplies",
    "Fan/heater",
    "Water toys",
    "Outdoor games",
    "BBQ tools"
  ]
};

export const tripTypeDescriptions: Record<TripType, string> = {
  'car camping': "Car camping allows you to bring more comfort items since you can drive right up to your campsite. Focus on comfort and convenience.",
  'canoe camping': "Canoe camping requires waterproof gear and safety equipment for water travel. Pack light but bring essential safety items.",
  'hike camping': "Hiking to your campsite requires ultralight and compact gear. Focus on the essentials and emergency preparedness.",
  'cottage': "Cottage trips allow for more comfort items and home-like amenities. Think about entertainment and longer-term stays."
}; 
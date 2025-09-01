import { PackingItem, TripType, TripTypeOption } from '../types';
import { separateAndItems, PackingSuggestion } from './activityEquipment';

const createItem = (
  name: string,
  category: string,
  weight?: number,
  quantity: number = 1,
  required: boolean = true,
  isPersonal: boolean = false
): PackingItem => ({
  id: crypto.randomUUID(),
  name,
  category,
  quantity: isPersonal ? 1 : quantity,
  weight,
  isOwned: false,
  needsToBuy: false,
  isPacked: false,
  required,
  assignedGroupId: undefined,
  isPersonal
});

// Helper function to calculate clothing quantities based on trip duration
const calculateClothingQuantity = (baseDays: number, tripDays: number, itemType: 'basic' | 'underwear' | 'socks'): number => {
  if (itemType === 'underwear' || itemType === 'socks') {
    // Pack one per day plus one extra, max of 7 for longer trips
    return Math.min(tripDays + 1, 7);
  }
  if (itemType === 'basic') {
    // Basic clothing: 1 for day trips, 2-3 for 2-4 days, 4-5 for longer
    if (tripDays <= 1) return 1;
    if (tripDays <= 4) return Math.ceil(tripDays / 2) + 1;
    return Math.min(5, Math.ceil(tripDays / 3) + 2);
  }
  return 1;
};

export const getCarCampingTemplate = (groupSize: number, tripDays: number = 2): PackingItem[] => {
  const items = [
  // Shelter - Required (Group Items)
  createItem('Tent', 'Shelter', undefined, 1, true, false),
  createItem('Tent poles', 'Shelter', undefined, 1, true, false),
  createItem('Tent stakes', 'Shelter', undefined, 1, true, false),
  createItem('Sleeping bag', 'Sleep', 1500, groupSize, true, true),
  createItem('Sleeping pad', 'Sleep', 800, groupSize, true, true),
  createItem('Emergency blanket', 'Shelter', undefined, 1, true, false),
  
  // Shelter - Optional
  createItem('Tent footprint', 'Shelter', undefined, 1, false, false),
  createItem('Tarp', 'Shelter', undefined, 1, false, false),
  createItem('Pillow', 'Sleep', 300, groupSize, false, true),
  createItem('Sleeping bag liner', 'Sleep', 200, groupSize, false, true),
  createItem('Tent repair kit', 'Shelter', undefined, 1, false, false),
  
  // Kitchen - Required (Group Items)
  createItem('Stove', 'Kitchen', undefined, 1, true, false),
  createItem('Fuel', 'Kitchen', undefined, 1, true, false),
  createItem('Lighter/matches', 'Kitchen', undefined, 1, true, false),
  createItem('Cookware set', 'Kitchen', undefined, 1, true, false),
  createItem('Utensils', 'Kitchen', undefined, 1, true, false),
  createItem('Water jug', 'Kitchen', undefined, 1, true, false),
  createItem('Water filter/purification', 'Kitchen', undefined, 1, true, false),
  createItem('Trash bags', 'Kitchen', undefined, 1, true, false),
  
  // Kitchen - Optional
  createItem('Plates', 'Kitchen', undefined, groupSize, false, false),
  createItem('Bowls', 'Kitchen', undefined, groupSize, false, false),
  createItem('Cups', 'Kitchen', undefined, groupSize, false, false),
  createItem('Mugs', 'Kitchen', undefined, groupSize, false, false),
  createItem('Cooler', 'Kitchen', undefined, 1, false, false),
  createItem('Ice', 'Kitchen', undefined, 1, false, false),
  createItem('Coffee maker', 'Kitchen', undefined, 1, false, false),
  createItem('Camp sink', 'Kitchen', undefined, 1, false, false),
  createItem('Dish soap', 'Kitchen', undefined, 1, false, false),
  createItem('Sponge', 'Kitchen', undefined, 1, false, false),
  createItem('Can opener', 'Kitchen', undefined, 1, false, false),
  createItem('Cutting board', 'Kitchen', undefined, 1, false, false),
  createItem('Aluminum foil', 'Kitchen', undefined, 1, false, false),
  createItem('Ziploc bags', 'Kitchen', undefined, 1, false, false),
  createItem('Paper towels', 'Kitchen', undefined, 1, false, false),
  
  // Clothing - Required (Personal Items)
  createItem('Hiking boots or sturdy shoes', 'Clothing', undefined, groupSize, true, true),
  createItem('Hiking socks', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'socks'), true, true),
  createItem('Underwear', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'underwear'), true, true),
  createItem('Comfortable pants', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), true, true),
  createItem('T-shirts/casual shirts', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'basic'), true, true),
  createItem('Warm layer (fleece/jacket)', 'Clothing', undefined, groupSize, true, true),
  createItem('Rain jacket', 'Clothing', undefined, groupSize, true, true),
  createItem('Sun hat or cap', 'Clothing', undefined, groupSize, true, true),
  createItem('Sunglasses', 'Clothing', undefined, groupSize, true, true),
  
  // Clothing - Optional (Personal Items)
  createItem('Long pants (extra pair)', 'Clothing', undefined, groupSize, false, true),
  createItem('Long sleeve shirts', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true),
  createItem('Shorts', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true),
  createItem('Warm gloves', 'Clothing', undefined, groupSize, false, true),
  createItem('Swimsuit', 'Clothing', undefined, groupSize, false, true),
  createItem('Camp shoes (sandals/slip-ons)', 'Clothing', undefined, groupSize, false, true),
  createItem('Sleepwear/pajamas', 'Clothing', undefined, groupSize * Math.min(2, Math.ceil(tripDays / 3)), false, true),
  createItem('Bandana or buff', 'Clothing', undefined, groupSize, false, true),
  
  // Personal - Required (Mix of Personal and Group Items)
  createItem('Toothbrush', 'Personal', undefined, groupSize, true, true),
  createItem('Toothpaste', 'Personal', undefined, groupSize, true, true),
  createItem('Soap', 'Personal', undefined, groupSize, true, true),
  createItem('Hand sanitizer', 'Personal', undefined, 1, true, false),
  createItem('Towel', 'Personal', undefined, groupSize, true, true),
  createItem('Sunscreen', 'Personal', undefined, groupSize, true, true),
  createItem('Bug spray', 'Personal', undefined, 1, true, false),
  createItem('First aid kit', 'Personal', undefined, 1, true, false),
  createItem('Medications', 'Personal', undefined, groupSize, true, true),
  createItem('Toilet paper', 'Personal', undefined, 1, true, false),
  
  // Personal - Optional (Mix of Personal and Group Items)
  createItem('Deodorant', 'Personal', undefined, groupSize, false, true),
  createItem('Hair brush', 'Personal', undefined, groupSize, false, true),
  createItem('Contact solution', 'Personal', undefined, groupSize, false, true),
  createItem('Lip balm', 'Personal', undefined, groupSize, false, true),
  createItem('Baby wipes', 'Personal', undefined, 1, false, false),
  createItem('Mirror', 'Personal', undefined, 1, false, false),
  createItem('Ear plugs', 'Personal', undefined, groupSize, false, true),
  createItem('Eye mask', 'Personal', undefined, groupSize, false, true),
  
  // Tools & Safety - Required (Mix of Personal and Group Items)
  createItem('Headlamp', 'Tools', 100, groupSize, true, true),
  createItem('Battery pack', 'Tools', undefined, groupSize, true, true),
  createItem('Multi-tool', 'Tools', 100, 1, true, false),
  createItem('Duct tape', 'Tools', 50, 1, true, false),
  createItem('Paracord', 'Tools', 100, 1, true, false),
  createItem('Map', 'Tools', 50, 1, true, false),
  createItem('Compass', 'Tools', 50, 1, true, false),
  createItem('Fire starter', 'Tools', 50, 1, true, false),
  
  // Tools & Safety - Optional (Mix of Personal and Group Items)
  createItem('GPS device', 'Tools', 200, 1, false, false),
  createItem('Walkie talkies', 'Tools', 300, 1, false, false),
  createItem('Power bank', 'Tools', 200, 1, false, false),
  createItem('Phone charger', 'Tools', 50, 1, false, false),
  createItem('Bear spray', 'Tools', 400, 1, false, false),
  createItem('Axe/hatchet', 'Tools', 800, 1, false, false),
  createItem('Folding saw', 'Tools', 300, 1, false, false),
  createItem('Satellite communicator', 'Tools', 150, 1, false, false),
  
  // Comfort - Optional (Mix of Personal and Group Items)
  createItem('Camp chairs', 'Comfort', undefined, groupSize, false, true),
  createItem('Camp table', 'Fun and games', undefined, 1, false, false),
  createItem('Lantern', 'Fun and games', undefined, 1, false, false),
  createItem('Books/games', 'Fun and games', undefined, 1, false, false),
  createItem('Hammock', 'Fun and games', undefined, 1, false, false),
  createItem('Camp shower', 'Fun and games', undefined, 1, false, false),
  createItem('Portable speaker', 'Fun and games', undefined, 1, false, false),
  createItem('Camera', 'Comfort', undefined, groupSize, false, true),
  createItem('Binoculars', 'Fun and games', undefined, 1, false, false),
];
  return processPackingItems(items);
};

export const getBackcountryTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
  // Shelter - Required (Group Items)
  createItem('Lightweight tent', 'Shelter', 2000, 1, true, false),
  createItem('Tent poles', 'Shelter', 800, 1, true, false),
  createItem('Tent stakes', 'Shelter', 200, 1, true, false),
  createItem('Sleeping bag', 'Sleep', 800, groupSize, true, true),
  createItem('Sleeping pad', 'Sleep', 400, groupSize, true, true),
  createItem('Emergency blanket', 'Shelter', 100, 1, true, false), // Added as required
  
  // Shelter - Optional
  createItem('Tent footprint', 'Shelter', 300, 1, false, false),
  createItem('Pillow', 'Sleep', 150, groupSize, false, true),
  createItem('Sleeping bag liner', 'Sleep', 100, groupSize, false, true),
  createItem('Tent repair kit', 'Shelter', 50, 1, false, false),
  createItem('Bivy sack', 'Shelter', 300, groupSize, false, true),
  
  // Kitchen - Required (Group Items)
  createItem('Lightweight stove', 'Kitchen', 300, 1, true, false),
  createItem('Fuel canister', 'Kitchen', 400, 1, true, false),
  createItem('Lighter', 'Kitchen', 20, 1, true, false),
  createItem('Pot', 'Kitchen', 400, 1, true, false),
  createItem('Spork', 'Kitchen', 20, groupSize, true, true),
  createItem('Water filter', 'Kitchen', 300, 1, true, false),
  createItem('Water bottle', 'Personal', 500, groupSize, true, true),
  createItem('Food bag', 'Kitchen', 100, 1, true, false),
  
  // Kitchen - Optional
  createItem('Bear canister', 'Kitchen', 1000, 1, false, false),
  createItem('Coffee filter', 'Kitchen', 10, 1, false, false),
  createItem('Salt/pepper', 'Kitchen', 20, 1, false, false),
  createItem('Hot sauce', 'Kitchen', 30, 1, false, false),
  createItem('Cup', 'Kitchen', 100, groupSize, false, false),
  createItem('Bowl', 'Kitchen', 150, groupSize, false, false),
  createItem('Food storage bag', 'Kitchen', 50, 1, false, false),
  
  // Clothing - Required (Personal Items - Minimalist for hiking)
  createItem('Hiking boots', 'Clothing', 800, groupSize, true, true),
  createItem('Merino wool/synthetic hiking socks', 'Clothing', 100, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'socks'), 4), true, true),
  createItem('Moisture-wicking underwear', 'Clothing', 50, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'underwear'), 4), true, true),
  createItem('Hiking pants (quick-dry)', 'Clothing', 300, groupSize, true, true),
  createItem('Moisture-wicking base layer shirts', 'Clothing', 200, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'basic'), 3), true, true),
  createItem('Insulating layer (fleece/down)', 'Clothing', 400, groupSize, true, true),
  createItem('Rain jacket (waterproof)', 'Clothing', 300, groupSize, true, true),
  createItem('Warm hat (beanie)', 'Clothing', 100, groupSize, true, true),
  createItem('Sunglasses', 'Clothing', 50, groupSize, true, true),
  
  // Clothing - Optional (Personal Items - Lightweight options)
  createItem('Base layer bottom (merino wool)', 'Clothing', 200, groupSize, false, true),
  createItem('Hiking shorts', 'Clothing', 150, groupSize, false, true),
  createItem('Long-sleeve sun shirt', 'Clothing', 180, groupSize, false, true),
  createItem('Lightweight gloves', 'Clothing', 100, groupSize, false, true),
  createItem('Quick-dry camp shoes', 'Clothing', 300, groupSize, false, true),
  createItem('Lightweight sleepwear', 'Clothing', 150, groupSize * (tripDays > 3 ? 1 : 0), false, true),
  createItem('Buff or bandana', 'Clothing', 30, groupSize, false, true),
  createItem('Gaiters', 'Clothing', 200, groupSize, false, true),
  createItem('Rain pants (lightweight)', 'Clothing', 250, groupSize, false, true),
  createItem('Puffy jacket (down/synthetic)', 'Clothing', 350, groupSize, false, true),
  
  // Personal - Required (Mix of Personal and Group Items)
  createItem('Toothbrush', 'Personal', 20, groupSize, true, true),
  createItem('Toothpaste', 'Personal', 50, groupSize, true, true),
  createItem('Biodegradable soap', 'Personal', 100, groupSize, true, true),
  createItem('Hand sanitizer', 'Personal', 50, 1, true, false), // Group item
  createItem('Small towel', 'Personal', 100, groupSize, true, true),
  createItem('Sunscreen', 'Personal', 100, groupSize, true, true),
  createItem('Bug spray', 'Personal', 100, 1, true, false), // Group item
  createItem('First aid kit', 'Personal', 300, 1, true, false), // Group item
  createItem('Medications', 'Personal', undefined, groupSize, true, true),
  createItem('Toilet paper', 'Personal', 50, 1, true, false), // Group item
  
  // Personal - Optional
  createItem('Deodorant', 'Personal', 50, groupSize, false, true),
  createItem('Lip balm', 'Personal', 20, groupSize, false, true),
  createItem('Baby wipes', 'Personal', 100, 1, false, false),
  createItem('Mirror', 'Personal', 30, 1, false, false),
  createItem('Ear plugs', 'Personal', 10, groupSize, false, true),
  createItem('Eye mask', 'Personal', 20, groupSize, false, true),
  createItem('Contact solution', 'Personal', 100, groupSize, false, true),
  createItem('Hair brush', 'Personal', 50, groupSize, false, true),
  
  // Tools & Safety - Required
  createItem('Headlamp', 'Tools', 100, groupSize, true, true),
  createItem('Battery pack', 'Tools', undefined, groupSize, true, true),
  createItem('Multi-tool', 'Tools', 100, 1, true, false),
  createItem('Duct tape', 'Tools', 50, 1, true, false),
  createItem('Paracord', 'Tools', 100, 1, true, false),
  createItem('Map', 'Tools', 50, 1, true, false),
  createItem('Compass', 'Tools', 50, 1, true, false),
  createItem('Fire starter', 'Tools', 50, 1, true, false),
  
  // Tools & Safety - Optional
  createItem('GPS device', 'Tools', 200, 1, false, false),
  createItem('Walkie talkies', 'Tools', 300, 1, false, false),
  createItem('Power bank', 'Tools', 200, 1, false, false),
  createItem('Phone charger', 'Tools', 50, 1, false, false),
  createItem('Bear spray', 'Tools', 400, 1, false, false),
  createItem('Axe/hatchet', 'Tools', 800, 1, false, false),
  createItem('Folding saw', 'Tools', 300, 1, false, false),
  createItem('Satellite communicator', 'Tools', 150, 1, false, false),
  
  // Pack - Required
  createItem('Backpack', 'Pack', 1500, groupSize, true, true),
  createItem('Pack cover', 'Pack', 200, groupSize, true, true),
  createItem('Dry bags', 'Pack', 100, groupSize * 2, true, true),
  
  // Pack - Optional
  createItem('Pack liner', 'Pack', 50, groupSize, false, true),
  createItem('Stuff sacks', 'Pack', 50, groupSize * 3, false, true),
  createItem('Compression straps', 'Pack', 30, 1, false, false),
  createItem('Pack repair kit', 'Pack', 50, 1, false, false),
  
  // Comfort - Optional (Mix of Personal and Group Items)
  createItem('Camp chair', 'Comfort', 500, groupSize, false, true),
  createItem('Books/games', 'Fun and games', 200, 1, false, false),
  createItem('Camera', 'Comfort', 300, groupSize, false, true),
  createItem('Binoculars', 'Fun and games', 400, 1, false, false),
  createItem('Portable speaker', 'Fun and games', 200, 1, false, false),
  createItem('Hammock', 'Fun and games', 400, 1, false, false),
  createItem('Trekking poles', 'Comfort', 300, groupSize, false, true),
];
  return processPackingItems(items);
};

export const getCottageTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
  // Kitchen - Required (Group Items - assuming well-stocked kitchen)
  createItem('Cooler', 'Kitchen', undefined, 1, true, false),
  createItem('Ice packs', 'Kitchen', undefined, Math.ceil(tripDays / 2), true, false),
  createItem('Aluminum foil', 'Kitchen', undefined, 1, true, false),
  createItem('Plastic wrap', 'Kitchen', undefined, 1, true, false),
  createItem('Trash bags', 'Kitchen', undefined, Math.ceil(tripDays / 2), true, false),
  createItem('Coffee', 'Kitchen', undefined, 1, true, false),
  createItem('Tea bags', 'Kitchen', undefined, 1, true, false),
  createItem('Sugar/sweetener', 'Kitchen', undefined, 1, true, false),
  createItem('Cream/milk', 'Kitchen', undefined, 1, true, false),
  
  // Clothing - Required (Personal Items - Comfortable cottage wear)
  createItem('Casual everyday shirts', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), true, true),
  createItem('Comfortable pants/jeans', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), true, true),
  createItem('Underwear', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'underwear'), true, true),
  createItem('Casual socks', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'socks'), true, true),
  createItem('Comfortable shoes/sneakers', 'Clothing', undefined, 1, true, true),
  createItem('Light jacket', 'Clothing', undefined, 1, true, true),
  createItem('Sleepwear/pajamas', 'Clothing', undefined, Math.min(3, Math.ceil(tripDays / 2)), true, true),
  
  // Clothing - Optional (Personal Items - Leisure and activity wear)
  createItem('Shorts', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), false, true),
  createItem('Swimsuit/swim trunks', 'Clothing', undefined, 1, false, true),
  createItem('Beach/pool towels', 'Clothing', undefined, 1, false, true),
  createItem('Flip flops or sandals', 'Clothing', undefined, 1, false, true),
  createItem('Sun hat or cap', 'Clothing', undefined, 1, false, true),
  createItem('Sunglasses', 'Clothing', undefined, 1, false, true),
  createItem('Rain jacket or windbreaker', 'Clothing', undefined, 1, false, true),
  createItem('Warm sweater (evenings)', 'Clothing', undefined, 1, false, true),
  
  // Personal - Required (Personal Items)
  createItem('Toilet paper (backup)', 'Personal', undefined, 1, true, false),
  createItem('Toothbrush', 'Personal', undefined, 1, true, true),
  createItem('Toothpaste', 'Personal', undefined, 1, true, true),
  createItem('Sunscreen', 'Personal', undefined, 1, true, true),
  createItem('Bug spray/insect repellent', 'Personal', undefined, 1, true, false),
  createItem('First aid kit', 'Personal', undefined, 1, true, false),
  createItem('Personal medications', 'Personal', undefined, 1, true, true),
  
  // Personal - Optional (Personal Items)
  createItem('Deodorant', 'Personal', undefined, 1, false, true),
  createItem('Hair styling products', 'Personal', undefined, 1, false, true),
  createItem('Face wash/skincare', 'Personal', undefined, 1, false, true),
  createItem('Moisturizer/lotion', 'Personal', undefined, 1, false, true),
  createItem('Razors/shaving supplies', 'Personal', undefined, 1, false, true),
  createItem('Contact solution/glasses', 'Personal', undefined, 1, false, true),
  
  // Tools & Safety - Required (Group Items)
  createItem('Flashlight', 'Tools', undefined, 1, true, true),
  createItem('Battery pack', 'Tools', undefined, groupSize, true, true),
  createItem('Matches/lighter', 'Tools', undefined, 1, true, false),
  createItem('Area maps/guidebooks', 'Tools', undefined, 1, true, false),
  
  // Tools & Safety - Optional (Personal Items)
  createItem('Phone chargers/cables', 'Tools', undefined, 1, false, true),
  createItem('Power bank/portable charger', 'Tools', undefined, 1, false, true),
  createItem('Charging cables', 'Tools', undefined, 1, false, false),
  
  // Comfort - Optional (Mix of Personal and Group Items)
  createItem('Board games/card games', 'Fun and games', undefined, Math.min(3, Math.ceil(tripDays / 2)), false, false),
  createItem('Books/magazines', 'Fun and games', undefined, Math.min(3, tripDays), false, false),
  createItem('Tablet/e-reader', 'Comfort', undefined, 1, false, true),
  createItem('Water toys/floaties', 'Fun and games', undefined, 1, false, false),
  createItem('Beach chairs', 'Comfort', undefined, 1, false, true),
  createItem('Beach umbrella', 'Fun and games', undefined, 1, false, false),
  createItem('Hammock', 'Fun and games', undefined, 1, false, false),
  createItem('Portable speakers', 'Fun and games', undefined, 1, false, false),
  createItem('Camera', 'Comfort', undefined, 1, false, true),
  createItem('Binoculars', 'Fun and games', undefined, 1, false, false),
  createItem('Outdoor games (frisbee, etc.)', 'Fun and games', undefined, tripDays > 2 ? 1 : 0, false, false),
  
  // Kitchen - Optional (Group Items)
  createItem('Favorite condiments/sauces', 'Kitchen', undefined, 1, false, false),
  ];
  return processPackingItems(items);
};

export const getCanoeCampingTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
  // Transportation & Safety - Required (Group Items)
  createItem('Canoe', 'Transportation', undefined, 1, true, false),
  createItem('Canoe straps on vehicle', 'Transportation', undefined, 1, true, false),
  createItem('Paddles', 'Transportation', undefined, 1, true, false),
  createItem('Bailer', 'Transportation', undefined, 1, true, false),
  createItem('Life jackets', 'Transportation', undefined, 1, true, false),
  createItem('Rope', 'Tools', undefined, 1, true, false),
  
  // Shelter - Required (Group Items)
  createItem('Tent', 'Shelter', 2500, 1, true, false),
  createItem('Tent poles', 'Shelter', 600, 1, true, false),
  createItem('Tent stakes', 'Shelter', 200, 1, true, false),
  createItem('Sleeping bag', 'Sleep', 1200, groupSize, true, true),
  createItem('Sleeping pad', 'Sleep', 500, groupSize, true, true),
  createItem('Camping pillow', 'Sleep', 200, groupSize, true, true),
  createItem('Tarps', 'Shelter', 400, 1, true, false),
  createItem('Fire starters', 'Tools', 50, 1, true, false),
  
  // Kitchen - Required (Group Items)
  createItem('Portable camp stove', 'Kitchen', 400, 1, true, false),
  createItem('Fuel', 'Kitchen', 400, 1, true, false),
  createItem('Lighter', 'Kitchen', 20, 1, true, false),
  createItem('Pot and pan', 'Kitchen', 500, 1, true, false),
  createItem('Utensils', 'Kitchen', 50, groupSize, true, false),
  createItem('Bowl', 'Kitchen', 100, groupSize, true, false),
  createItem('Plates', 'Kitchen', 80, groupSize, true, false),
  createItem('Cup', 'Kitchen', 60, groupSize, true, false),
  createItem('Coffee cone + filter', 'Kitchen', 100, 1, true, false),
  createItem('Water purification system', 'Kitchen', 200, 1, true, false),
  createItem('Water container', 'Kitchen', 300, 1, true, false),
  createItem('Water bottle', 'Personal', 150, groupSize, true, true),
  createItem('Food storage (bear-proof)', 'Kitchen', 200, 1, true, false),
  createItem('Large ziplock bags', 'Kitchen', 50, 1, true, false),
  createItem('Garbage bags', 'Kitchen', 100, 1, true, false),
  createItem('Biodegradable dish soap', 'Kitchen', 100, 1, true, false),
  createItem('Dish cloth', 'Kitchen', 30, 1, true, false),
  createItem('Hand wipes', 'Kitchen', 50, 1, true, false),
  createItem('Dishes container', 'Kitchen', 200, 1, true, false),
  createItem('Hand towel', 'Kitchen', 80, 1, true, false),
  createItem('Paper towel', 'Kitchen', 100, 1, true, false),
  createItem('Cooler', 'Kitchen', undefined, 1, true, false),
  
  // Clothing - Required (Personal Items - Water-appropriate)
  createItem('Quick-dry hiking pants', 'Clothing', 250, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), true, true),
  createItem('Moisture-wicking shirts', 'Clothing', 150, groupSize * calculateClothingQuantity(2, tripDays, 'basic'), true, true),
  createItem('Underwear', 'Clothing', 40, groupSize * calculateClothingQuantity(1, tripDays, 'underwear'), true, true),
  createItem('Socks', 'Clothing', 80, groupSize * calculateClothingQuantity(2, tripDays, 'socks'), true, true),
  createItem('Water shoes/sandals', 'Clothing', 300, groupSize, true, true),
  createItem('Waterproof rain jacket', 'Clothing', 400, groupSize, true, true),
  createItem('Warm layer', 'Clothing', 350, groupSize, true, true),
  createItem('Sun hat', 'Clothing', 80, groupSize, true, true),
  createItem('Sunglasses', 'Clothing', 60, groupSize, true, true),
  createItem('Toque', 'Clothing', 80, groupSize, true, true),
  createItem('Swim suit', 'Clothing', 100, groupSize, true, true),
  
  // Clothing - Optional (Personal Items)
  createItem('Shorts', 'Clothing', 120, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true),
  createItem('Long-sleeve sun shirt', 'Clothing', 180, groupSize, false, true),
  createItem('Camp shoes', 'Clothing', 200, groupSize, false, true),
  createItem('Sleepwear', 'Clothing', 120, groupSize * (tripDays > 2 ? 1 : 0), false, true),
  
  // Personal - Required (Mix of Personal and Group Items)
  createItem('Biodegradable shampoo', 'Personal', 100, 1, true, false),
  createItem('Towel', 'Personal', 150, groupSize, true, true),
  createItem('Toothbrush', 'Personal', 20, groupSize, true, true),
  createItem('Toothpaste (small tube)', 'Personal', 50, groupSize, true, true),
  createItem('Sunscreen (waterproof)', 'Personal', 120, groupSize, true, true),
  createItem('Bug spray (DEET)', 'Personal', 100, 1, true, false),
  createItem('First aid kit (waterproof)', 'Personal', 400, 1, true, false),
  createItem('Personal medications', 'Personal', undefined, groupSize, true, true),
  createItem('Ear plugs', 'Personal', 10, groupSize, true, true),
  createItem('Deodorant', 'Personal', 50, groupSize, true, true),
  createItem('Headphones', 'Personal', 50, groupSize, true, true),
  createItem('Wallet', 'Personal', 50, groupSize, true, true),
  createItem('Phone', 'Personal', 200, groupSize, true, true),
  createItem('Keys', 'Personal', 20, groupSize, true, true),
  createItem('Book', 'Personal', 300, groupSize, true, true),
  createItem('Cord for phone', 'Personal', 30, groupSize, true, true),
  createItem('Toilet paper', 'Personal', 100, 1, true, false),
  createItem('Trail permit', 'Personal', 10, 1, true, false),
  
  // Tools & Safety - Required (Mix of Personal and Group Items)
  createItem('Headlamp or flashlight + batteries', 'Tools', 150, groupSize, true, true),
  createItem('Battery pack', 'Tools', undefined, groupSize, true, true),
  createItem('Multi-tool', 'Tools', 120, 1, true, false),
  createItem('Duct tape', 'Tools', 80, 1, true, false),
  createItem('Map (in waterproof case)', 'Tools', 50, 1, true, false),
  createItem('Saw and/or hatchet', 'Tools', 300, 1, true, false),
  
  // Tools & Safety - Optional (Group Items)
  
  // Comfort - Optional (Mix of Personal and Group Items)
  createItem('Waterproof camera', 'Comfort', 300, groupSize, false, true),
  createItem('Binoculars (waterproof)', 'Fun and games', 400, 1, false, false),
  createItem('Waterproof playing cards', 'Fun and games', 50, 1, false, false),
  createItem('Camp chair (lightweight)', 'Comfort', 600, groupSize, false, true),
  createItem('Garden gloves', 'Comfort', 100, groupSize, false, true),
  createItem('Floaty', 'Comfort', 200, groupSize, false, true),
  createItem('Hammocks', 'Comfort', 400, groupSize, false, true),
  createItem('Fun games', 'Fun and games', 500, 1, false, false),
  ];
  return processPackingItems(items);
};

// Main function to get packing list based on trip type and duration
export const getPackingTemplate = (tripType: TripTypeOption, groupSize: number, tripDays: number): PackingItem[] => {
  switch (tripType) {
    case 'car camping':
      return getCarCampingTemplate(groupSize, tripDays);
    case 'hike camping':
      return getBackcountryTemplate(groupSize, tripDays);
    case 'canoe camping':
      return getCanoeCampingTemplate(groupSize, tripDays);
    case 'cottage':
      return getCottageTemplate(groupSize, tripDays);
    default:
      return getCarCampingTemplate(groupSize, tripDays);
  }
};

interface PackingTemplateItem {
  name: string;
  category: string;
}

interface PackingTemplate {
  essentials: PackingTemplateItem[];
  recommended: PackingTemplateItem[];
}

export const packingTemplates: Record<TripTypeOption, PackingTemplate> = {
  'car camping': {
    essentials: [
      { name: 'Tent', category: 'Shelter' },
      { name: 'Sleeping bag', category: 'Sleep' },
      { name: 'Sleeping pad', category: 'Sleep' },
      { name: 'Pillow', category: 'Sleep' },
      { name: 'Camp stove', category: 'Kitchen' },
      { name: 'Fuel', category: 'Kitchen' },
      { name: 'Cookware', category: 'Kitchen' },
      { name: 'Utensils', category: 'Kitchen' },
      { name: 'Plates', category: 'Kitchen' },
      { name: 'Bowls', category: 'Kitchen' },
      { name: 'Water bottles', category: 'Personal' },
      { name: 'Headlamp', category: 'Tools' },
      { name: 'First aid kit', category: 'Personal' },
      { name: 'Toiletries', category: 'Personal' },
      { name: 'Toilet paper', category: 'Personal' },
      { name: 'Trash bags', category: 'Kitchen' }
    ],
    recommended: [
      { name: 'Camping chairs', category: 'Fun and games' },
      { name: 'Table', category: 'Fun and games' },
      { name: 'Lantern', category: 'Tools' },
      { name: 'Cooler', category: 'Kitchen' },
      { name: 'Ice', category: 'Kitchen' },
      { name: 'Grill grate', category: 'Kitchen' },
      { name: 'Firewood', category: 'Fun and games' },
      { name: 'Matches/lighter', category: 'Tools' },
      { name: 'Rope/paracord', category: 'Tools' },
      { name: 'Multi-tool', category: 'Tools' },
      { name: 'Tarp', category: 'Shelter' },
      { name: 'Bug spray', category: 'Personal' },
      { name: 'Sunscreen', category: 'Personal' },
      { name: 'Games/books', category: 'Fun and games' },
      { name: 'Camera', category: 'Fun and games' }
    ]
  },
  'canoe camping': {
    essentials: [
      { name: 'Canoe', category: 'Transportation' },
      { name: 'Paddles', category: 'Transportation' },
      { name: 'Life jackets', category: 'Transportation' },
      { name: 'Dry bags', category: 'Storage' },
      { name: 'Waterproof tent', category: 'Shelter' },
      { name: 'Sleeping bag', category: 'Sleep' },
      { name: 'Sleeping pad', category: 'Sleep' },
      { name: 'Portable stove', category: 'Kitchen' },
      { name: 'Waterproof matches', category: 'Kitchen' },
      { name: 'Water purification', category: 'Kitchen' },
      { name: 'First aid kit', category: 'Personal' },
      { name: 'Headlamp', category: 'Tools' },
      { name: 'Map', category: 'Tools' },
      { name: 'Compass', category: 'Tools' },
      { name: 'Rope', category: 'Tools' },
      { name: 'Repair kit', category: 'Tools' }
    ],
    recommended: [
      { name: 'Waterproof camera', category: 'Fun and games' },
      { name: 'Binoculars', category: 'Fun and games' },
      { name: 'Quick-dry towel', category: 'Personal' },
      { name: 'Water shoes', category: 'Clothing' },
      { name: 'Rain gear', category: 'Clothing' },
      { name: 'Extra dry bags', category: 'Storage' },
      { name: 'Duct tape', category: 'Tools' },
      { name: 'Multi-tool', category: 'Tools' },
      { name: 'Emergency shelter', category: 'Safety' },
      { name: 'Signal mirror', category: 'Safety' }
    ]
  },
  'hike camping': {
    essentials: [
      { name: 'Backpack', category: 'Storage' },
      { name: 'Ultralight tent', category: 'Shelter' },
      { name: 'Sleeping bag', category: 'Sleep' },
      { name: 'Sleeping pad', category: 'Sleep' },
      { name: 'Trekking poles', category: 'Tools' },
      { name: 'Headlamp', category: 'Tools' },
      { name: 'Map', category: 'Tools' },
      { name: 'Compass', category: 'Tools' },
      { name: 'First aid kit', category: 'Personal' },
      { name: 'Water bottles', category: 'Personal' },
      { name: 'Water filter', category: 'Kitchen' },
      { name: 'Lightweight stove', category: 'Kitchen' },
      { name: 'Trail snacks', category: 'Kitchen' },
      { name: 'Bug spray', category: 'Personal' },
      { name: 'Sunscreen', category: 'Personal' },
      { name: 'Emergency shelter', category: 'Shelter' }
    ],
    recommended: [
      { name: 'GPS device', category: 'Tools' },
      { name: 'Duct tape', category: 'Tools' },
      { name: 'Extra batteries', category: 'Tools' },
      { name: 'Portable charger', category: 'Tools' },
      { name: 'Rain gear', category: 'Clothing' },
      { name: 'Warm layers', category: 'Clothing' },
      { name: 'Camera', category: 'Fun and games' },
      { name: 'Journal', category: 'Fun and games' }
    ]
  },
  'cottage': {
    essentials: [
      { name: 'Cooler', category: 'Kitchen' },
      { name: 'Ice packs', category: 'Kitchen' },
      { name: 'Aluminum foil', category: 'Kitchen' },
      { name: 'Plastic wrap', category: 'Kitchen' },
      { name: 'Trash bags', category: 'Kitchen' },
      { name: 'Coffee', category: 'Kitchen' },
      { name: 'Tea bags', category: 'Kitchen' },
      { name: 'Sugar', category: 'Kitchen' },
      { name: 'Cream/milk', category: 'Kitchen' },
      { name: 'Toilet paper', category: 'Personal' },
      { name: 'Toothbrush', category: 'Personal' },
      { name: 'Toothpaste', category: 'Personal' },
      { name: 'Sunscreen', category: 'Personal' },
      { name: 'Bug spray', category: 'Personal' },
      { name: 'First aid kit', category: 'Personal' },
      { name: 'Medications', category: 'Personal' },
      { name: 'Flashlight', category: 'Tools' },
      { name: 'Batteries', category: 'Tools' },
      { name: 'Matches', category: 'Tools' },
      { name: 'Lighter', category: 'Tools' },
      { name: 'Map', category: 'Tools' },
      { name: 'Compass', category: 'Tools' },
    ],
    recommended: [
      { name: 'Favorite condiments', category: 'Kitchen' },
      { name: 'Comfortable clothing', category: 'Clothing' },
      { name: 'Extra layers', category: 'Clothing' },
      { name: 'Swimwear', category: 'Clothing' },
      { name: 'Beach towels', category: 'Clothing' },
      { name: 'Flip flops', category: 'Clothing' },
      { name: 'Sandals', category: 'Clothing' },
      { name: 'Hats', category: 'Clothing' },
      { name: 'Sunglasses', category: 'Clothing' },
      { name: 'Rain jackets', category: 'Clothing' },
      { name: 'Umbrellas', category: 'Clothing' },
      { name: 'Warm sweaters', category: 'Clothing' },
      { name: 'Pajamas', category: 'Clothing' },
      { name: 'Deodorant', category: 'Personal' },
      { name: 'Hair products', category: 'Personal' },
      { name: 'Face wash', category: 'Personal' },
      { name: 'Moisturizer', category: 'Personal' },
      { name: 'Razors', category: 'Personal' },
      { name: 'Shaving cream', category: 'Personal' },
      { name: 'Contact solution', category: 'Personal' },
      { name: 'Glasses', category: 'Personal' },
      { name: 'Board games', category: 'Fun and games' },
      { name: 'Cards', category: 'Fun and games' },
      { name: 'Books', category: 'Fun and games' },
      { name: 'Magazines', category: 'Fun and games' },
      { name: 'Tablet/e-reader', category: 'Fun and games' },
      { name: 'Water toys', category: 'Fun and games' },
      { name: 'Floaties', category: 'Fun and games' },
      { name: 'Beach chairs', category: 'Fun and games' },
      { name: 'Umbrella', category: 'Fun and games' },
      { name: 'Hammock', category: 'Fun and games' },
      { name: 'Portable speakers', category: 'Fun and games' },
      { name: 'Camera', category: 'Fun and games' },
      { name: 'Binoculars', category: 'Fun and games' },
      { name: 'Local maps', category: 'Tools' },
      { name: 'Guidebooks', category: 'Tools' },
      { name: 'Phone chargers', category: 'Tools' },
      { name: 'Adapters', category: 'Tools' },
      { name: 'Power bank', category: 'Tools' },
      { name: 'Charging cables', category: 'Tools' },
    ]
  }
};

export const specializedGear: Record<TripTypeOption, string[]> = {
  'car camping': [
    'Camp stove',
    'Cooler',
    'Camping chairs',
    'Lantern',
    'Firewood',
    'Axe',
    'Grill grate'
  ],
  'canoe camping': [
    'Canoe',
    'Paddles',
    'Life jackets',
    'Rope',
    'Repair kit'
  ],
  'hike camping': [
    'Backpack',
    'Trekking poles',
    'Ultralight tent',
    'Compression sacks',
    'Trail map',
    'Compass',
    'Emergency beacon'
  ],
  'cottage': [
    'Board games',
    'Beach toys',
    'Water toys',
    'Outdoor games',
    'Entertainment items'
  ]
};

export const tripTypeDescriptions: Record<TripTypeOption, string> = {
  'car camping': "Car camping allows you to bring more comfort items since you can drive right up to your campsite. Focus on comfort and convenience.",
  'canoe camping': "Canoe camping requires waterproof gear and safety equipment for water travel. Pack light but bring essential safety items.",
  'hike camping': "Hiking to your campsite requires ultralight and compact gear. Focus on the essentials and emergency preparedness.",
  'cottage': "Cottage trips assume access to a well-stocked kitchen with basic cookware, utensils, and appliances. Focus on personal items, specialty ingredients, outdoor activities, and entertainment for your stay."
};

export const getPackingListDescription = (type: TripType): string => {
  return tripTypeDescriptions[type];
};

// Utility function to apply 'and' separation to packing templates
export const processPackingItems = (items: PackingItem[]): PackingItem[] => {
  const suggestions: PackingSuggestion[] = items.map(item => ({
    name: item.name,
    category: item.category,
    required: item.required,
    quantity: item.quantity
  }));
  
  const separatedSuggestions = separateAndItems(suggestions);
  
  return separatedSuggestions.map((suggestion, index) => {
    // Find the original item to preserve its isPersonal property
    const originalItem = items.find(item => item.name.toLowerCase().includes(suggestion.name.toLowerCase()));
    
    return {
      id: crypto.randomUUID(),
      name: suggestion.name,
      category: suggestion.category,
      quantity: suggestion.quantity || 1,
      weight: undefined,
      isOwned: false,
      needsToBuy: false,
      isPacked: false,
      required: suggestion.required,
      assignedGroupId: undefined,
      isPersonal: originalItem?.isPersonal ?? false
    };
  });
}; 
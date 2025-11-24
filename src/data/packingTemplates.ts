import { PackingItem, TripType, TripTypeOption, PackingSuggestion } from '../types';
import { separateAndItems } from './activityEquipment';

const createItem = (
  name: string,
  category: string,
  weight?: number,
  quantity: number = 1,
  required: boolean = true,
  isPersonal: boolean = false,
  subcategory?: string
): PackingItem => ({
  id: crypto.randomUUID(),
  name,
  category,
  subcategory,
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

export const getDayHikeTemplate = (groupSize: number, tripDays: number = 1): PackingItem[] => {
  const items = [
    // Navigation
    createItem('Map', 'Navigation', undefined, 1, true, false),
    createItem('Compass', 'Navigation', undefined, 1, true, false),
    createItem('GPS/Phone', 'Navigation', undefined, 1, false, true),

    // Food & Water
    createItem('Water Bottle/Bladder (2L)', 'Food & Water', undefined, 1, true, true),
    createItem('Trail Snacks', 'Food & Water', undefined, 1, true, true),
    createItem('Lunch', 'Food & Water', undefined, 1, true, true),
    createItem('Electrolytes', 'Food & Water', undefined, 1, false, true),

    // Clothing
    createItem('Hiking Boots/Shoes', 'Clothing', undefined, 1, true, true),
    createItem('Hiking Socks', 'Clothing', undefined, 1, true, true),
    createItem('Rain Jacket', 'Clothing', undefined, 1, true, true),
    createItem('Warm Layer (Fleece)', 'Clothing', undefined, 1, true, true),
    createItem('Hat', 'Clothing', undefined, 1, true, true),
    createItem('Sunglasses', 'Clothing', undefined, 1, true, true),

    // Safety
    createItem('First Aid Kit', 'Safety', undefined, 1, true, false),
    createItem('Whistle', 'Safety', undefined, 1, true, true),
    createItem('Lighter/Matches', 'Fire & Light', undefined, 1, true, false),
    createItem('Headlamp', 'Fire & Light', undefined, 1, true, true),
    createItem('Multi-tool', 'Tools & Repair', undefined, 1, true, false),
    createItem('Sunscreen', 'Safety', undefined, 1, true, true),
    createItem('Bug Spray', 'Safety', undefined, 1, true, false),
    createItem('Toilet Paper & Trowel', 'Safety', undefined, 1, true, false),

    // Personal
    createItem('ID/Wallet', 'Personal', undefined, 1, true, true),
    createItem('Keys', 'Personal', undefined, 1, true, true),
    createItem('Phone', 'Personal', undefined, 1, true, true),
    createItem('Camera', 'Entertainment', undefined, 1, false, true),

    // Pack
    createItem('Day Pack', 'Pack', undefined, 1, true, true),
    createItem('Rain Cover', 'Pack', undefined, 1, false, true),
  ];
  return processPackingItems(items);
};

export const getCarCampingTemplate = (groupSize: number, tripDays: number = 2): PackingItem[] => {
  const items = [
    // Shelter
    createItem('Tent', 'Shelter', undefined, 1, true, false, 'Sleeping'),
    createItem('Tent poles', 'Shelter', undefined, 1, true, false, 'Sleeping'),
    createItem('Tent stakes', 'Shelter', undefined, 1, true, false, 'Sleeping'),
    createItem('Sleeping bag', 'Sleep', 1500, groupSize, true, true, 'Sleeping'),
    createItem('Sleeping pad', 'Sleep', 800, groupSize, true, true, 'Sleeping'),
    createItem('Emergency blanket', 'Safety', undefined, 1, true, false, 'Emergency'),
    createItem('Tent footprint', 'Shelter', undefined, 1, false, false, 'Sleeping'),
    createItem('Tarp', 'Shelter', undefined, 1, false, false, 'Site Setup'),
    createItem('Pillow', 'Sleep', 300, groupSize, false, true, 'Sleeping'),
    createItem('Sleeping bag liner', 'Sleep', 200, groupSize, false, true, 'Sleeping'),
    createItem('Tent repair kit', 'Tools & Repair', undefined, 1, false, false, 'Repair'),

    // Kitchen
    createItem('Stove', 'Kitchen', undefined, 1, true, false, 'Cooking'),
    createItem('Fuel', 'Kitchen', undefined, 1, true, false, 'Cooking'),
    createItem('Lighter/matches', 'Fire & Light', undefined, 1, true, false, 'Fire'),
    createItem('Cookware set', 'Kitchen', undefined, 1, true, false, 'Cooking'),
    createItem('Utensils', 'Kitchen', undefined, 1, true, false, 'Eating'),
    createItem('Water jug', 'Kitchen', undefined, 1, true, false, 'Water'),
    createItem('Trash bags', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('Plates', 'Kitchen', undefined, groupSize, false, false, 'Eating'),
    createItem('Bowls', 'Kitchen', undefined, groupSize, false, false, 'Eating'),
    createItem('Cups', 'Kitchen', undefined, groupSize, false, false, 'Eating'),
    createItem('Mugs', 'Kitchen', undefined, groupSize, false, false, 'Eating'),
    createItem('Cooler', 'Kitchen', undefined, 1, false, false, 'Food Storage'),
    createItem('Ice', 'Kitchen', undefined, 1, false, false, 'Food Storage'),
    createItem('Coffee maker', 'Kitchen', undefined, 1, false, false, 'Cooking'),
    createItem('Camp sink', 'Kitchen', undefined, 1, false, false, 'Cleaning'),
    createItem('Dish soap', 'Kitchen', undefined, 1, false, false, 'Cleaning'),
    createItem('Sponge', 'Kitchen', undefined, 1, false, false, 'Cleaning'),
    createItem('Can opener', 'Kitchen', undefined, 1, false, false, 'Cooking'),
    createItem('Cutting board', 'Kitchen', undefined, 1, false, false, 'Cooking'),
    createItem('Aluminum foil', 'Kitchen', undefined, 1, false, false, 'Cooking'),
    createItem('Ziploc bags', 'Kitchen', undefined, 1, false, false, 'Food Storage'),
    createItem('Paper towels', 'Kitchen', undefined, 1, false, false, 'Cleaning'),
    createItem('Water filter/purification', 'Kitchen', undefined, 1, false, false, 'Water'),

    // Logistics
    createItem('Campsite reservation & permits', 'Personal', undefined, 1, true, false, 'Documents'),
    createItem('Vehicle documents', 'Personal', undefined, 1, true, false, 'Documents'),

    // Tools
    createItem('Leveling blocks', 'Tools & Repair', undefined, 1, false, false, 'Vehicle'),
    createItem('Extension cord', 'Tools & Repair', undefined, 1, false, false, 'Power'),
    createItem('Firewood', 'Fire & Light', undefined, 1, false, false, 'Fire'),
    createItem('Heat-resistant gloves', 'Fire & Light', undefined, 1, false, false, 'Fire'),
    createItem('Headlamp', 'Fire & Light', 100, groupSize, true, true, 'Light'),
    createItem('Multi-tool', 'Tools & Repair', 100, 1, true, false, 'Tools'),
    createItem('Duct tape', 'Tools & Repair', 50, 1, true, false, 'Repair'),
    createItem('Paracord', 'Tools & Repair', 100, 1, true, false, 'Tools'),
    createItem('Map', 'Navigation', 50, 1, true, false, 'Navigation'),
    createItem('Compass', 'Navigation', 50, 1, true, false, 'Navigation'),
    createItem('Fire starter', 'Fire & Light', 50, 1, true, false, 'Fire'),
    createItem('Battery pack', 'Tools & Repair', undefined, Math.max(1, Math.ceil(groupSize / 2)), false, true, 'Power'),
    createItem('GPS device', 'Navigation', 200, 1, false, false, 'Navigation'),
    createItem('Walkie talkies', 'Tools & Repair', 300, 1, false, false, 'Comms'),
    createItem('Phone charger', 'Tools & Repair', 50, 1, false, false, 'Power'),
    createItem('Bear spray', 'Safety', 400, 1, false, false, 'Safety'),
    createItem('Axe/hatchet', 'Tools & Repair', 800, 1, false, false, 'Tools'),
    createItem('Folding saw', 'Tools & Repair', 300, 1, false, false, 'Tools'),
    createItem('Satellite communicator', 'Tools & Repair', 150, 1, false, false, 'Comms'),

    // Clothing
    createItem('Hiking boots', 'Clothing', undefined, groupSize, true, true, 'Footwear'),
    createItem('Hiking socks', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'socks'), true, true, 'Footwear'),
    createItem('Underwear', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'underwear'), true, true, 'Basics'),
    createItem('Comfortable pants', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), true, true, 'Bottoms'),
    createItem('T-shirts', 'Clothing', undefined, groupSize * calculateClothingQuantity(2, tripDays, 'basic'), true, true, 'Tops'),
    createItem('Warm layer', 'Clothing', undefined, groupSize, true, true, 'Layers'),
    createItem('Rain jacket', 'Clothing', undefined, groupSize, true, true, 'Outerwear'),
    createItem('Sun hat', 'Clothing', undefined, groupSize, true, true, 'Accessories'),
    createItem('Sunglasses', 'Personal', undefined, groupSize, true, true, 'Accessories'),
    createItem('Long pants', 'Clothing', undefined, groupSize, false, true, 'Bottoms'),
    createItem('Long sleeve shirts', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true, 'Tops'),
    createItem('Shorts', 'Clothing', undefined, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true, 'Bottoms'),
    createItem('Warm gloves', 'Clothing', undefined, groupSize, false, true, 'Accessories'),
    createItem('Swimsuit', 'Clothing', undefined, groupSize, false, true, 'Swim'),
    createItem('Camp shoes', 'Clothing', undefined, groupSize, false, true, 'Footwear'),
    createItem('Sleepwear', 'Clothing', undefined, groupSize * Math.min(2, Math.ceil(tripDays / 3)), false, true, 'Sleep'),
    createItem('Bandana/buff', 'Clothing', undefined, groupSize, false, true, 'Accessories'),

    // Personal
    createItem('Toothbrush', 'Personal', undefined, groupSize, true, true, 'Hygiene'),
    createItem('Toothpaste', 'Personal', undefined, groupSize, true, true, 'Hygiene'),
    createItem('Soap', 'Personal', undefined, groupSize, true, true, 'Hygiene'),
    createItem('Hand sanitizer', 'Personal', undefined, 1, true, false, 'Hygiene'),
    createItem('Towel', 'Personal', undefined, groupSize, true, true, 'Hygiene'),
    createItem('Sunscreen', 'Safety', undefined, groupSize, true, true, 'Sun Protection'),
    createItem('Bug spray', 'Safety', undefined, 1, true, false, 'Bugs'),
    createItem('First aid kit', 'Safety', undefined, 1, true, false, 'First Aid'),
    createItem('Medications', 'Personal', undefined, groupSize, true, true, 'Health'),
    createItem('Toilet paper', 'Personal', undefined, 1, true, false, 'Hygiene'),
    createItem('Deodorant', 'Personal', undefined, groupSize, false, true, 'Hygiene'),
    createItem('Hair brush', 'Personal', undefined, groupSize, false, true, 'Hygiene'),
    createItem('Contact solution', 'Personal', undefined, groupSize, false, true, 'Hygiene'),
    createItem('Lip balm', 'Personal', undefined, groupSize, false, true, 'Hygiene'),
    createItem('Baby wipes', 'Personal', undefined, 1, false, false, 'Hygiene'),
    createItem('Mirror', 'Personal', undefined, 1, false, false, 'Hygiene'),
    createItem('Ear plugs', 'Personal', undefined, groupSize, false, true, 'Sleep'),
    createItem('Eye mask', 'Personal', undefined, groupSize, false, true, 'Sleep'),

    // Entertainment & Comfort
    createItem('Camp chairs', 'Comfort', undefined, groupSize, false, true, 'Seating'),
    createItem('Camp table', 'Comfort', undefined, 1, false, false, 'Furniture'),
    createItem('Lantern', 'Fire & Light', undefined, 1, false, false, 'Light'),
    createItem('Books/games', 'Entertainment', undefined, 1, false, false, 'Games'),
    createItem('Hammock', 'Comfort', undefined, 1, false, false, 'Relaxation'),
    createItem('Camp shower', 'Comfort', undefined, 1, false, false, 'Hygiene'),
    createItem('Portable speaker', 'Entertainment', undefined, 1, false, false, 'Music'),
    createItem('Camera', 'Entertainment', undefined, groupSize, false, true, 'Photography'),
    createItem('Binoculars', 'Entertainment', undefined, 1, false, false, 'Observation'),
  ];
  return processPackingItems(items);
};

export const getBackcountryTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
    // Shelter
    createItem('Lightweight tent', 'Shelter', 2000, 1, true, false, 'Sleeping'),
    createItem('Tent poles', 'Shelter', 800, 1, true, false, 'Sleeping'),
    createItem('Tent stakes', 'Shelter', 200, 1, true, false, 'Sleeping'),
    createItem('Sleeping bag', 'Sleep', 800, groupSize, true, true, 'Sleeping'),
    createItem('Sleeping pad', 'Sleep', 400, groupSize, true, true, 'Sleeping'),
    createItem('Emergency blanket', 'Safety', 100, 1, true, false, 'Emergency'),
    createItem('Tent footprint', 'Shelter', 300, 1, false, false, 'Sleeping'),
    createItem('Pillow', 'Sleep', 150, groupSize, false, true, 'Sleeping'),
    createItem('Sleeping bag liner', 'Sleep', 100, groupSize, false, true, 'Sleeping'),
    createItem('Tent repair kit', 'Tools & Repair', 50, 1, false, false, 'Repair'),
    createItem('Bivy sack', 'Shelter', 300, groupSize, false, true, 'Sleeping'),

    // Kitchen
    createItem('Lightweight stove', 'Kitchen', 300, 1, true, false, 'Cooking'),
    createItem('Fuel canister', 'Kitchen', 400, 1, true, false, 'Cooking'),
    createItem('Lighter', 'Fire & Light', 20, 1, true, false, 'Fire'),
    createItem('Pot', 'Kitchen', 400, 1, true, false, 'Cooking'),
    createItem('Spork', 'Kitchen', 20, groupSize, true, true, 'Eating'),
    createItem('Water filter', 'Kitchen', 300, 1, true, false, 'Water'),
    createItem('Backup water purification', 'Kitchen', 50, 1, true, false, 'Water'),
    createItem('Water bottle', 'Food & Water', 500, groupSize, true, true, 'Water'),
    createItem('Food bag', 'Kitchen', 100, 1, true, false, 'Food Storage'),
    createItem('Bear canister', 'Kitchen', 1000, 1, false, false, 'Food Storage'),
    createItem('Coffee filter', 'Kitchen', 10, 1, false, false, 'Cooking'),
    createItem('Salt/pepper', 'Kitchen', 20, 1, false, false, 'Cooking'),
    createItem('Hot sauce', 'Kitchen', 30, 1, false, false, 'Cooking'),
    createItem('Cup', 'Kitchen', 100, groupSize, false, false, 'Eating'),
    createItem('Bowl', 'Kitchen', 150, groupSize, false, false, 'Eating'),
    createItem('Food storage bag', 'Kitchen', 50, 1, false, false, 'Food Storage'),

    // Clothing
    createItem('Hiking boots', 'Clothing', 800, groupSize, true, true, 'Footwear'),
    createItem('Hiking socks', 'Clothing', 100, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'socks'), 4), true, true, 'Footwear'),
    createItem('Underwear', 'Clothing', 50, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'underwear'), 4), true, true, 'Basics'),
    createItem('Hiking pants', 'Clothing', 300, groupSize, true, true, 'Bottoms'),
    createItem('Base layer shirts', 'Clothing', 200, groupSize * Math.min(calculateClothingQuantity(2, tripDays, 'basic'), 3), true, true, 'Tops'),
    createItem('Insulating layer', 'Clothing', 400, groupSize, true, true, 'Layers'),
    createItem('Rain jacket', 'Clothing', 300, groupSize, true, true, 'Outerwear'),
    createItem('Warm hat', 'Clothing', 100, groupSize, true, true, 'Accessories'),
    createItem('Sunglasses', 'Clothing', 50, groupSize, true, true, 'Accessories'),
    createItem('Base layer bottom', 'Clothing', 200, groupSize, false, true, 'Bottoms'),
    createItem('Hiking shorts', 'Clothing', 150, groupSize, false, true, 'Bottoms'),
    createItem('Sun shirt', 'Clothing', 180, groupSize, false, true, 'Tops'),
    createItem('Lightweight gloves', 'Clothing', 100, groupSize, false, true, 'Accessories'),
    createItem('Camp shoes', 'Clothing', 300, groupSize, false, true, 'Footwear'),
    createItem('Sleepwear', 'Clothing', 150, groupSize * (tripDays > 3 ? 1 : 0), false, true, 'Sleep'),
    createItem('Buff/bandana', 'Clothing', 30, groupSize, false, true, 'Accessories'),
    createItem('Gaiters', 'Clothing', 200, groupSize, false, true, 'Accessories'),
    createItem('Rain pants', 'Clothing', 250, groupSize, false, true, 'Outerwear'),
    createItem('Puffy jacket', 'Clothing', 350, groupSize, false, true, 'Layers'),

    // Personal
    createItem('Toothbrush', 'Personal', 20, groupSize, true, true, 'Hygiene'),
    createItem('Toothpaste', 'Personal', 50, groupSize, true, true, 'Hygiene'),
    createItem('Biodegradable soap', 'Personal', 100, groupSize, true, true, 'Hygiene'),
    createItem('Hand sanitizer', 'Personal', 50, 1, true, false, 'Hygiene'),
    createItem('Small towel', 'Personal', 100, groupSize, true, true, 'Hygiene'),
    createItem('Sunscreen', 'Safety', 100, groupSize, true, true, 'Sun Protection'),
    createItem('Bug spray', 'Safety', 100, 1, true, false, 'Bugs'),
    createItem('First aid kit', 'Safety', 300, 1, true, false, 'First Aid'),
    createItem('Medications', 'Personal', undefined, groupSize, true, true, 'Health'),
    createItem('Toilet paper', 'Personal', 50, 1, true, false, 'Hygiene'),
    createItem('WAG bags/Trowel', 'Safety', 50, 1, true, false, 'Hygiene'),
    createItem('Deodorant', 'Personal', 50, groupSize, false, true, 'Hygiene'),
    createItem('Lip balm', 'Personal', 20, groupSize, false, true, 'Hygiene'),
    createItem('Baby wipes', 'Personal', 100, 1, false, false, 'Hygiene'),
    createItem('Mirror', 'Personal', 30, 1, false, false, 'Hygiene'),
    createItem('Ear plugs', 'Personal', 10, groupSize, false, true, 'Sleep'),
    createItem('Eye mask', 'Personal', 20, groupSize, false, true, 'Sleep'),
    createItem('Contact solution', 'Personal', 100, groupSize, false, true, 'Hygiene'),
    createItem('Hair brush', 'Personal', 50, groupSize, false, true, 'Hygiene'),

    // Tools & Safety
    createItem('Headlamp', 'Fire & Light', 100, groupSize, true, true, 'Light'),
    createItem('Multi-tool', 'Tools & Repair', 100, 1, true, false, 'Tools'),
    createItem('Duct tape', 'Tools & Repair', 50, 1, true, false, 'Repair'),
    createItem('Paracord', 'Tools & Repair', 100, 1, true, false, 'Tools'),
    createItem('Map', 'Navigation', 50, 1, true, false, 'Navigation'),
    createItem('Compass', 'Navigation', 50, 1, true, false, 'Navigation'),
    createItem('Fire starter', 'Fire & Light', 50, 1, true, false, 'Fire'),
    createItem('Whistle', 'Safety', 20, groupSize, true, true, 'Safety'),
    createItem('Bear hang kit', 'Tools & Repair', 150, 1, true, false, 'Food Storage'),
    createItem('Battery pack', 'Tools & Repair', undefined, Math.max(1, Math.ceil(groupSize / 2)), false, true, 'Power'),
    createItem('GPS device', 'Navigation', 200, 1, false, false, 'Navigation'),
    createItem('Walkie talkies', 'Tools & Repair', 300, 1, false, false, 'Comms'),
    createItem('Phone charger', 'Tools & Repair', 50, 1, false, false, 'Power'),
    createItem('Bear spray', 'Safety', 400, 1, false, false, 'Safety'),
    createItem('Folding saw', 'Tools & Repair', 300, 1, false, false, 'Tools'),
    createItem('Satellite communicator', 'Tools & Repair', 150, 1, false, false, 'Comms'),
    createItem('Trekking poles', 'Tools & Repair', 300, groupSize, false, true, 'Hiking'),

    // Pack
    createItem('Backpack', 'Pack', 1500, groupSize, true, true, 'Pack'),
    createItem('Pack cover', 'Pack', 200, groupSize, true, true, 'Pack'),
    createItem('Dry bags', 'Pack', 100, groupSize * 2, true, true, 'Storage'),
    createItem('Pack liner', 'Pack', 50, groupSize, false, true, 'Storage'),
    createItem('Stuff sacks', 'Pack', 50, groupSize * 3, false, true, 'Storage'),
    createItem('Compression straps', 'Pack', 30, 1, false, false, 'Storage'),
    createItem('Pack repair kit', 'Tools & Repair', 50, 1, false, false, 'Repair'),

    // Entertainment & Comfort
    createItem('Books/games', 'Entertainment', 200, 1, false, false, 'Games'),
    createItem('Camp chair', 'Comfort', 500, groupSize, false, true, 'Seating'),
    createItem('Camera', 'Entertainment', 300, groupSize, false, true, 'Photography'),
    createItem('Portable speaker', 'Entertainment', 200, 1, false, false, 'Music'),
    createItem('Hammock', 'Comfort', 400, 1, false, false, 'Relaxation'),
  ];
  return processPackingItems(items);
};

export const getCottageTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
    // Kitchen
    createItem('Cooler', 'Kitchen', undefined, 1, true, false, 'Food Storage'),
    createItem('Ice packs', 'Kitchen', undefined, Math.ceil(tripDays / 2), true, false, 'Food Storage'),
    createItem('Aluminum foil', 'Kitchen', undefined, 1, true, false, 'Cooking'),
    createItem('Plastic wrap', 'Kitchen', undefined, 1, true, false, 'Cooking'),
    createItem('Trash bags', 'Kitchen', undefined, Math.ceil(tripDays / 2), true, false, 'Cleaning'),
    createItem('Coffee', 'Food & Water', undefined, 1, true, false, 'Beverages'),
    createItem('Tea bags', 'Food & Water', undefined, 1, true, false, 'Beverages'),
    createItem('Sugar/sweetener', 'Food & Water', undefined, 1, true, false, 'Pantry'),
    createItem('Cream/milk', 'Food & Water', undefined, 1, true, false, 'Pantry'),
    createItem('Dish soap', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('Dishwasher detergent', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('Dish sponge', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('Paper towels', 'Kitchen', undefined, Math.ceil(tripDays / 2), true, false, 'Cleaning'),
    createItem('Food storage containers', 'Kitchen', undefined, 1, true, false, 'Food Storage'),
    createItem('Spices/Oil', 'Food & Water', undefined, 1, true, false, 'Pantry'),
    createItem('Condiments', 'Food & Water', undefined, 1, true, false, 'Pantry'),

    // Logistics
    createItem('Reservation confirmation', 'Personal', undefined, 1, true, false, 'Documents'),
    createItem('Driving directions', 'Navigation', undefined, 1, true, false, 'Navigation'),
    createItem('Emergency contact list', 'Safety', undefined, 1, true, false, 'Safety'),

    // Clothing
    createItem('Casual shirts', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), true, true, 'Tops'),
    createItem('Comfortable pants', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), true, true, 'Bottoms'),
    createItem('Underwear', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'underwear'), true, true, 'Basics'),
    createItem('Socks', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'socks'), true, true, 'Basics'),
    createItem('Sneakers', 'Clothing', undefined, 1, true, true, 'Footwear'),
    createItem('Light jacket', 'Clothing', undefined, 1, true, true, 'Outerwear'),
    createItem('Sleepwear', 'Clothing', undefined, Math.min(3, Math.ceil(tripDays / 2)), true, true, 'Sleep'),
    createItem('Shorts', 'Clothing', undefined, calculateClothingQuantity(1, tripDays, 'basic'), false, true, 'Bottoms'),
    createItem('Swimsuit', 'Clothing', undefined, 1, false, true, 'Swim'),
    createItem('Flip flops/sandals', 'Clothing', undefined, 1, false, true, 'Footwear'),
    createItem('Sun hat', 'Clothing', undefined, 1, false, true, 'Accessories'),
    createItem('Sunglasses', 'Clothing', undefined, 1, false, true, 'Accessories'),
    createItem('Rain jacket', 'Clothing', undefined, 1, false, true, 'Outerwear'),
    createItem('Warm sweater', 'Clothing', undefined, 1, false, true, 'Layers'),

    // Bedding & Linens
    createItem('Bed sheets', 'Sleep', undefined, Math.max(1, Math.ceil(groupSize / 2)), true, false, 'Bedding'),
    createItem('Pillowcases', 'Sleep', undefined, groupSize, true, false, 'Bedding'),
    createItem('Blanket/duvet', 'Sleep', undefined, Math.max(1, Math.ceil(groupSize / 2)), true, false, 'Bedding'),
    createItem('Pillows', 'Sleep', undefined, groupSize, true, true, 'Bedding'),
    createItem('Bath towels', 'Personal', undefined, groupSize, true, true, 'Linens'),
    createItem('Hand towels', 'Personal', undefined, Math.max(1, Math.ceil(groupSize / 2)), true, false, 'Linens'),
    createItem('Beach towels', 'Personal', undefined, groupSize, false, true, 'Linens'),

    // Personal
    createItem('Toilet paper', 'Personal', undefined, 1, true, false, 'Hygiene'),
    createItem('Toothbrush', 'Personal', undefined, 1, true, true, 'Hygiene'),
    createItem('Toothpaste', 'Personal', undefined, 1, true, true, 'Hygiene'),
    createItem('Hand soap', 'Personal', undefined, 1, true, false, 'Hygiene'),
    createItem('Sunscreen', 'Safety', undefined, 1, true, true, 'Sun Protection'),
    createItem('Bug spray', 'Safety', undefined, 1, true, false, 'Bugs'),
    createItem('First aid kit', 'Safety', undefined, 1, true, false, 'First Aid'),
    createItem('Medications', 'Personal', undefined, 1, true, true, 'Health'),
    createItem('Deodorant', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Hair products', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Face wash', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Moisturizer', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Razors', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Contact solution', 'Personal', undefined, 1, false, true, 'Hygiene'),
    createItem('Laundry detergent', 'Kitchen', undefined, 1, false, false, 'Cleaning'),

    // Tools & Safety
    createItem('Flashlight', 'Fire & Light', undefined, 1, true, true, 'Light'),
    createItem('Battery pack', 'Tools & Repair', undefined, groupSize, true, true, 'Power'),
    createItem('Matches/lighter', 'Fire & Light', undefined, 1, true, false, 'Fire'),
    createItem('Area maps', 'Navigation', undefined, 1, true, false, 'Navigation'),
    createItem('Cleaning wipes', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('All-purpose cleaner', 'Kitchen', undefined, 1, true, false, 'Cleaning'),
    createItem('Phone chargers', 'Tools & Repair', undefined, 1, false, true, 'Power'),
    createItem('Extension cord', 'Tools & Repair', undefined, 1, false, false, 'Power'),
    createItem('Basic tool kit', 'Tools & Repair', undefined, 1, false, false, 'Tools'),
    createItem('Spare batteries', 'Tools & Repair', undefined, 1, false, false, 'Power'),

    // Entertainment & Comfort
    createItem('Board games', 'Entertainment', undefined, Math.min(3, Math.ceil(tripDays / 2)), false, false, 'Games'),
    createItem('Books', 'Entertainment', undefined, Math.min(3, tripDays), false, false, 'Reading'),
    createItem('Tablet/e-reader', 'Entertainment', undefined, 1, false, true, 'Electronics'),
    createItem('Water toys', 'Entertainment', undefined, 1, false, false, 'Water Fun'),
    createItem('Beach chairs', 'Comfort', undefined, 1, false, true, 'Seating'),
    createItem('Beach umbrella', 'Comfort', undefined, 1, false, false, 'Shade'),
    createItem('Hammock', 'Comfort', undefined, 1, false, false, 'Relaxation'),
    createItem('Portable speakers', 'Entertainment', undefined, 1, false, false, 'Music'),
    createItem('Camera', 'Entertainment', undefined, 1, false, true, 'Photography'),
    createItem('Binoculars', 'Entertainment', undefined, 1, false, false, 'Observation'),
    createItem('Outdoor games', 'Entertainment', undefined, tripDays > 2 ? 1 : 0, false, false, 'Games'),
  ];
  return processPackingItems(items);
};

export const getCanoeCampingTemplate = (groupSize: number, tripDays: number = 3): PackingItem[] => {
  const items = [
    // Transportation & Safety
    createItem('Canoe', 'Transportation', undefined, 1, true, false, 'Boat'),
    createItem('Canoe straps', 'Transportation', undefined, 1, true, false, 'Transport'),
    createItem('Paddles', 'Transportation', undefined, Math.max(groupSize + 1, 3), true, false, 'Boat'),
    createItem('Bailer', 'Transportation', undefined, 1, true, false, 'Safety'),
    createItem('Life jackets', 'Transportation', undefined, Math.max(groupSize, 2), true, true, 'Safety'),
    createItem('Throw bag', 'Safety', undefined, 1, true, false, 'Water Rescue'),
    createItem('Portage pack/barrel', 'Pack', undefined, 1, true, false, 'Pack'),
    createItem('Rope', 'Tools & Repair', undefined, 1, true, false, 'Tools'),

    // Shelter
    createItem('Tent', 'Shelter', 2500, 1, true, false, 'Sleeping'),
    createItem('Tent poles', 'Shelter', 600, 1, true, false, 'Sleeping'),
    createItem('Tent stakes', 'Shelter', 200, 1, true, false, 'Sleeping'),
    createItem('Sleeping bag', 'Sleep', 1200, groupSize, true, true, 'Sleeping'),
    createItem('Sleeping pad', 'Sleep', 500, groupSize, true, true, 'Sleeping'),
    createItem('Camping pillow', 'Sleep', 200, groupSize, true, true, 'Sleeping'),
    createItem('Tarps', 'Shelter', 400, 1, true, false, 'Site Setup'),
    createItem('Fire starters', 'Fire & Light', 50, 1, true, false, 'Fire'),

    // Kitchen
    createItem('Portable camp stove', 'Kitchen', 400, 1, true, false, 'Cooking'),
    createItem('Fuel', 'Kitchen', 400, 1, true, false, 'Cooking'),
    createItem('Lighter', 'Fire & Light', 20, 1, true, false, 'Fire'),
    createItem('Pot and pan', 'Kitchen', 500, 1, true, false, 'Cooking'),
    createItem('Utensils', 'Kitchen', 50, groupSize, true, false, 'Eating'),
    createItem('Bowl', 'Kitchen', 100, groupSize, true, false, 'Eating'),
    createItem('Plates', 'Kitchen', 80, groupSize, true, false, 'Eating'),
    createItem('Cup', 'Kitchen', 60, groupSize, true, false, 'Eating'),
    createItem('Coffee cone + filter', 'Kitchen', 100, 1, true, false, 'Cooking'),
    createItem('Water purification system', 'Kitchen', 200, 1, true, false, 'Water'),
    createItem('Water container', 'Kitchen', 300, 1, true, false, 'Water'),
    createItem('Water bottle', 'Food & Water', 150, groupSize, true, true, 'Water'),
    createItem('Food storage (bear-proof)', 'Kitchen', 200, 1, true, false, 'Food Storage'),
    createItem('Large ziplock bags', 'Kitchen', 50, 1, true, false, 'Food Storage'),
    createItem('Garbage bags', 'Kitchen', 100, 1, true, false, 'Cleaning'),
    createItem('Biodegradable dish soap', 'Kitchen', 100, 1, true, false, 'Cleaning'),
    createItem('Dish cloth', 'Kitchen', 30, 1, true, false, 'Cleaning'),
    createItem('Hand wipes', 'Kitchen', 50, 1, true, false, 'Cleaning'),
    createItem('Dishes container', 'Kitchen', 200, 1, true, false, 'Cleaning'),
    createItem('Hand towel', 'Kitchen', 80, 1, true, false, 'Cleaning'),
    createItem('Paper towel', 'Kitchen', 100, 1, true, false, 'Cleaning'),
    createItem('Cooler', 'Kitchen', undefined, 1, true, false, 'Food Storage'),

    // Clothing
    createItem('Quick-dry hiking pants', 'Clothing', 250, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), true, true, 'Bottoms'),
    createItem('Moisture-wicking shirts', 'Clothing', 150, groupSize * calculateClothingQuantity(2, tripDays, 'basic'), true, true, 'Tops'),
    createItem('Underwear', 'Clothing', 40, groupSize * calculateClothingQuantity(1, tripDays, 'underwear'), true, true, 'Basics'),
    createItem('Socks', 'Clothing', 80, groupSize * calculateClothingQuantity(2, tripDays, 'socks'), true, true, 'Basics'),
    createItem('Water shoes/sandals', 'Clothing', 300, groupSize, true, true, 'Footwear'),
    createItem('Waterproof rain jacket', 'Clothing', 400, groupSize, true, true, 'Outerwear'),
    createItem('Warm layer', 'Clothing', 350, groupSize, true, true, 'Layers'),
    createItem('Sun hat', 'Clothing', 80, groupSize, true, true, 'Accessories'),
    createItem('Sunglasses', 'Clothing', 60, groupSize, true, true, 'Accessories'),
    createItem('Toque', 'Clothing', 80, groupSize, true, true, 'Accessories'),
    createItem('Swim suit', 'Clothing', 100, groupSize, true, true, 'Swim'),
    createItem('Shorts', 'Clothing', 120, groupSize * calculateClothingQuantity(1, tripDays, 'basic'), false, true, 'Bottoms'),
    createItem('Long-sleeve sun shirt', 'Clothing', 180, groupSize, false, true, 'Tops'),
    createItem('Camp shoes', 'Clothing', 200, groupSize, false, true, 'Footwear'),
    createItem('Sleepwear', 'Clothing', 120, groupSize * (tripDays > 2 ? 1 : 0), false, true, 'Sleep'),

    // Personal
    createItem('Biodegradable shampoo', 'Personal', 100, 1, true, false, 'Hygiene'),
    createItem('Towel', 'Personal', 150, groupSize, true, true, 'Hygiene'),
    createItem('Toothbrush', 'Personal', 20, groupSize, true, true, 'Hygiene'),
    createItem('Toothpaste', 'Personal', 50, groupSize, true, true, 'Hygiene'),
    createItem('Sunscreen (waterproof)', 'Safety', 120, groupSize, true, true, 'Sun Protection'),
    createItem('Bug spray (DEET)', 'Safety', 100, 1, true, false, 'Bugs'),
    createItem('First aid kit (waterproof)', 'Safety', 400, 1, true, false, 'First Aid'),
    createItem('Personal medications', 'Personal', undefined, groupSize, true, true, 'Health'),
    createItem('Ear plugs', 'Personal', 10, groupSize, true, true, 'Sleep'),
    createItem('Deodorant', 'Personal', 50, groupSize, true, true, 'Hygiene'),
    createItem('Wallet', 'Personal', 50, groupSize, true, true, 'Personal'),
    createItem('Phone', 'Personal', 200, groupSize, true, true, 'Electronics'),
    createItem('Keys', 'Personal', 20, groupSize, true, true, 'Personal'),
    createItem('Toilet paper', 'Personal', 100, 1, true, false, 'Hygiene'),
    createItem('Trail permit', 'Personal', 10, 1, true, false, 'Documents'),
    createItem('Headphones', 'Entertainment', 50, groupSize, false, true, 'Electronics'),
    createItem('Book', 'Entertainment', 300, groupSize, false, true, 'Reading'),

    // Tools & Safety
    createItem('Headlamp', 'Fire & Light', 150, groupSize, true, true, 'Light'),
    createItem('Battery pack', 'Tools & Repair', undefined, groupSize, true, true, 'Power'),
    createItem('Multi-tool', 'Tools & Repair', 120, 1, true, false, 'Tools'),
    createItem('Duct tape', 'Tools & Repair', 80, 1, true, false, 'Repair'),
    createItem('Map (waterproof)', 'Navigation', 50, 1, true, false, 'Navigation'),
    createItem('Saw and/or hatchet', 'Tools & Repair', 300, 1, true, false, 'Tools'),
    createItem('Cord for phone', 'Tools & Repair', 30, groupSize, false, true, 'Power'),

    // Entertainment & Comfort
    createItem('Waterproof camera', 'Entertainment', 300, groupSize, false, true, 'Photography'),
    createItem('Binoculars', 'Entertainment', 400, 1, false, false, 'Observation'),
    createItem('Waterproof playing cards', 'Entertainment', 50, 1, false, false, 'Games'),
    createItem('Camp chair', 'Comfort', 600, groupSize, false, true, 'Seating'),
    createItem('Garden gloves', 'Tools & Repair', 100, groupSize, false, true, 'Tools'),
    createItem('Floaty', 'Entertainment', 200, groupSize, false, true, 'Water Fun'),
    createItem('Hammocks', 'Comfort', 400, groupSize, false, true, 'Relaxation'),
    createItem('Fun games', 'Entertainment', 500, 1, false, false, 'Games'),
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
    case 'day hike':
      return getDayHikeTemplate(groupSize);
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
  },
  'day hike': {
    essentials: [
      { name: 'Day pack', category: 'Pack' },
      { name: 'Water bottle', category: 'Food & Water' },
      { name: 'Snacks', category: 'Food & Water' },
      { name: 'First aid kit', category: 'Safety' },
      { name: 'Map', category: 'Navigation' },
      { name: 'Compass', category: 'Navigation' },
      { name: 'Sunscreen', category: 'Safety' },
      { name: 'Rain jacket', category: 'Clothing' },
      { name: 'Headlamp', category: 'Fire & Light' },
      { name: 'Multi-tool', category: 'Tools & Repair' }
    ],
    recommended: [
      { name: 'Trekking poles', category: 'Tools & Repair' },
      { name: 'Camera', category: 'Entertainment' },
      { name: 'Binoculars', category: 'Entertainment' },
      { name: 'Guidebook', category: 'Navigation' },
      { name: 'Power bank', category: 'Tools & Repair' },
      { name: 'Extra layers', category: 'Clothing' }
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
  ],
  'day hike': [
    'Day pack',
    'Trekking poles',
    'Water bottle',
    'First aid kit',
    'Map',
    'Compass'
  ]
};

export const tripTypeDescriptions: Record<TripTypeOption, string> = {
  'car camping': "Car camping allows you to bring more comfort items since you can drive right up to your campsite. Focus on comfort and convenience.",
  'canoe camping': "Canoe camping requires waterproof gear and safety equipment for water travel. Pack light but bring essential safety items.",
  'hike camping': "Hiking to your campsite requires ultralight and compact gear. Focus on the essentials and emergency preparedness.",
  'cottage': "Cottage trips assume access to a well-stocked kitchen with basic cookware, utensils, and appliances. Focus on personal items, specialty ingredients, outdoor activities, and entertainment for your stay.",
  'day hike': "Day hikes require lightweight gear for a single day on the trail. Focus on water, snacks, navigation, and safety essentials."
};

export const getPackingListDescription = (type: TripType): string => {
  return tripTypeDescriptions[type];
};

// Utility function to apply 'and' separation to packing templates
export const processPackingItems = (items: PackingItem[]): PackingItem[] => {
  const suggestions: PackingSuggestion[] = items.map(item => ({
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
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
      subcategory: suggestion.subcategory, // Preserve subcategory
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
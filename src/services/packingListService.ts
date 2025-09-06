import { PackingItem, Trip } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PackingProgress {
  totalItems: number;
  ownedItems: number;
  packedItems: number;
  needToBuyItems: number;
  ownedPercentage: number;
  packedPercentage: number;
}

export class PackingListService {
  static validateItemName(name: string, maxLength: number = 100): ValidationResult {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'Item name cannot be empty' };
    }
    
    if (trimmed.length > maxLength) {
      return { isValid: false, error: `Item name is too long (max ${maxLength} characters)` };
    }
    
    if (this.containsSuspiciousPatterns(trimmed)) {
      return { isValid: false, error: 'Item name contains invalid characters' };
    }
    
    return { isValid: true };
  }

  static validateNotes(notes: string, maxLength: number = 500): ValidationResult {
    const trimmed = notes.trim();
    
    if (trimmed.length > maxLength) {
      return { isValid: false, error: `Notes are too long (max ${maxLength} characters)` };
    }
    
    if (this.containsSuspiciousPatterns(trimmed)) {
      return { isValid: false, error: 'Notes contain invalid characters' };
    }
    
    return { isValid: true };
  }

  static sanitizeInput(input: string, maxLength: number = 200): string {
    return input
      .trim()
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .slice(0, maxLength);
  }

  private static containsSuspiciousPatterns(input: string): boolean {
    return !!(
      input.match(/<script.*?>.*?<\/script>/gi) ||
      input.match(/javascript:/gi) ||
      input.match(/on\w+=/gi)
    );
  }

  static calculateProgress(items: PackingItem[]): PackingProgress {
    const totalItems = items.length;
    const ownedItems = items.filter(item => item.isOwned).length;
    const packedItems = items.filter(item => item.isPacked).length;
    const needToBuyItems = items.filter(item => item.needsToBuy).length;

    return {
      totalItems,
      ownedItems,
      packedItems,
      needToBuyItems,
      ownedPercentage: totalItems > 0 ? Math.round((ownedItems / totalItems) * 100) : 0,
      packedPercentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0
    };
  }

  static groupItemsByCategory(items: PackingItem[]): Map<string, PackingItem[]> {
    const grouped = new Map<string, PackingItem[]>();
    
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return grouped;
  }

  static filterItemsByGroup(items: PackingItem[], groupId: string): PackingItem[] {
    if (groupId === 'all') {
      return items;
    }
    if (groupId === 'shared') {
      // Return only items without a group assignment (shared items)
      return items.filter(item => !item.assignedGroupId);
    }
    // Return items assigned to specific group plus shared items
    return items.filter(item => 
      item.assignedGroupId === groupId || !item.assignedGroupId
    );
  }

  static filterItemsBySearch(items: PackingItem[], searchTerm: string): PackingItem[] {
    if (!searchTerm.trim()) {
      return items;
    }
    
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.notes?.toLowerCase().includes(term)
    );
  }

  static sortItems(items: PackingItem[], sortBy: 'name' | 'category' | 'status' = 'category'): PackingItem[] {
    const sorted = [...items];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'status':
        return sorted.sort((a, b) => {
          if (a.isPacked !== b.isPacked) return a.isPacked ? 1 : -1;
          if (a.isOwned !== b.isOwned) return a.isOwned ? 1 : -1;
          if (a.needsToBuy !== b.needsToBuy) return a.needsToBuy ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      
      case 'category':
      default:
        return sorted.sort((a, b) => {
          const catCompare = (a.category || 'Other').localeCompare(b.category || 'Other');
          if (catCompare !== 0) return catCompare;
          return a.name.localeCompare(b.name);
        });
    }
  }

  static sortItemsIntelligently(items: PackingItem[]): PackingItem[] {
    return [...items].sort((a, b) => {
      // First sort by packed status (unpacked items first)
      if (a.isPacked !== b.isPacked) {
        return a.isPacked ? 1 : -1;
      }

      // Then by intelligent grouping within the same category
      const groupOrderA = this.getItemGroupOrder(a);
      const groupOrderB = this.getItemGroupOrder(b);
      
      if (groupOrderA !== groupOrderB) {
        return groupOrderA - groupOrderB;
      }

      // Finally by name within the same group
      return a.name.localeCompare(b.name);
    });
  }

  private static getItemGroupOrder(item: PackingItem): number {
    const category = (item.category || 'Other').toLowerCase();
    const name = item.name.toLowerCase();

    switch (category) {
      case 'kitchen':
        // Cooking heat source
        if (this.matchesKeywords(name, ['stove', 'fuel', 'propane', 'butane', 'lighter', 'matches'])) return 1;
        // Cooking vessels
        if (this.matchesKeywords(name, ['pot', 'pan', 'kettle', 'dutch oven', 'skillet', 'frying'])) return 2;
        // Eating/drinking vessels
        if (this.matchesKeywords(name, ['plate', 'bowl', 'cup', 'mug', 'glass', 'tumbler'])) return 3;
        // Utensils
        if (this.matchesKeywords(name, ['fork', 'knife', 'spoon', 'spatula', 'tongs', 'ladle', 'utensils'])) return 4;
        // Food prep tools
        if (this.matchesKeywords(name, ['cutting board', 'can opener', 'bottle opener', 'peeler', 'grater'])) return 5;
        // Cleaning supplies
        if (this.matchesKeywords(name, ['dish soap', 'sponge', 'towel', 'wash', 'scrub', 'clean'])) return 6;
        // Storage
        if (this.matchesKeywords(name, ['cooler', 'container', 'bag', 'storage', 'thermos'])) return 7;
        return 8;

      case 'shelter':
        // Tent system
        if (this.matchesKeywords(name, ['tent', 'stakes', 'footprint', 'rainfly', 'guy line', 'pole'])) return 1;
        // Sleep system  
        if (this.matchesKeywords(name, ['sleeping bag', 'sleeping pad', 'pillow', 'blanket', 'sheet', 'mattress'])) return 2;
        // Weather protection
        if (this.matchesKeywords(name, ['tarp', 'rope', 'cord', 'canopy', 'shelter'])) return 3;
        return 4;

      case 'clothing':
        // Base layers
        if (this.matchesKeywords(name, ['base layer', 'thermal', 'underwear', 'long underwear', 'merino'])) return 1;
        // Insulation layers
        if (this.matchesKeywords(name, ['fleece', 'jacket', 'vest', 'sweater', 'hoodie', 'insulation', 'puffy'])) return 2;
        // Shell layers
        if (this.matchesKeywords(name, ['rain jacket', 'rain pants', 'shell', 'windbreaker', 'poncho'])) return 3;
        // Regular clothing
        if (this.matchesKeywords(name, ['shirt', 'pants', 'shorts', 'dress', 'skirt'])) return 4;
        // Undergarments
        if (this.matchesKeywords(name, ['socks', 'underwear', 'bra', 'boxers', 'briefs'])) return 5;
        // Footwear
        if (this.matchesKeywords(name, ['boots', 'shoes', 'sandals', 'slippers', 'footwear'])) return 6;
        // Accessories
        if (this.matchesKeywords(name, ['hat', 'cap', 'gloves', 'mittens', 'scarf', 'belt'])) return 7;
        return 8;

      case 'personal':
        // Toiletries
        if (this.matchesKeywords(name, ['toothbrush', 'toothpaste', 'soap', 'shampoo', 'deodorant', 'lotion', 'sunscreen'])) return 1;
        // Medications
        if (this.matchesKeywords(name, ['medication', 'pills', 'prescription', 'vitamins', 'aspirin', 'ibuprofen'])) return 2;
        // Electronics
        if (this.matchesKeywords(name, ['phone', 'charger', 'headlamp', 'flashlight', 'battery', 'camera', 'gps'])) return 3;
        // Documents/money
        if (this.matchesKeywords(name, ['wallet', 'id', 'license', 'passport', 'cash', 'cards'])) return 4;
        return 5;

      case 'tools':
        // Cutting tools
        if (this.matchesKeywords(name, ['knife', 'multi-tool', 'axe', 'hatchet', 'saw', 'machete'])) return 1;
        // Fire starting
        if (this.matchesKeywords(name, ['lighter', 'matches', 'fire starter', 'tinder', 'kindling'])) return 2;
        // Repair items
        if (this.matchesKeywords(name, ['duct tape', 'tape', 'patch', 'repair', 'glue', 'zip tie'])) return 3;
        // Maintenance
        if (this.matchesKeywords(name, ['oil', 'grease', 'cleaner', 'lubricant', 'polish'])) return 4;
        return 5;

      case 'safety':
        // First aid
        if (this.matchesKeywords(name, ['first aid', 'bandage', 'antiseptic', 'gauze', 'medical'])) return 1;
        // Emergency items
        if (this.matchesKeywords(name, ['whistle', 'mirror', 'emergency', 'signal', 'flare'])) return 2;
        // Navigation
        if (this.matchesKeywords(name, ['map', 'compass', 'gps', 'navigation'])) return 3;
        return 4;

      case 'sleep':
        // Sleep system core
        if (this.matchesKeywords(name, ['sleeping bag', 'sleeping pad', 'mattress'])) return 1;
        // Sleep comfort
        if (this.matchesKeywords(name, ['pillow', 'blanket', 'sheet', 'liner'])) return 2;
        return 3;

      case 'comfort':
        // Seating
        if (this.matchesKeywords(name, ['chair', 'seat', 'cushion', 'pad'])) return 1;
        // Lighting
        if (this.matchesKeywords(name, ['lantern', 'light', 'lamp', 'candle'])) return 2;
        return 3;

      case 'pack':
        // Main carrying
        if (this.matchesKeywords(name, ['backpack', 'pack', 'bag', 'duffel'])) return 1;
        // Organization
        if (this.matchesKeywords(name, ['stuff sack', 'packing cube', 'dry bag', 'organizer'])) return 2;
        return 3;

      case 'transportation':
        // Vehicle items
        if (this.matchesKeywords(name, ['car', 'keys', 'charger', 'mount'])) return 1;
        return 2;

      case 'fun and games':
        // Games
        if (this.matchesKeywords(name, ['cards', 'game', 'puzzle', 'book'])) return 1;
        // Activities
        if (this.matchesKeywords(name, ['frisbee', 'ball', 'kite', 'music'])) return 2;
        return 3;

      default:
        return 999; // Unknown items go to the end
    }
  }

  private static matchesKeywords(itemName: string, keywords: string[]): boolean {
    const name = itemName.toLowerCase();
    return keywords.some(keyword => name.includes(keyword.toLowerCase()));
  }

  static getItemStatusIcon(item: PackingItem): string {
    if (item.isPacked) return '✅';
    if (item.isOwned) return '✓';
    if (item.needsToBuy) return '🛒';
    return '○';
  }

  static getItemStatusClass(item: PackingItem): string {
    // Always return the default styling regardless of status
    return 'bg-gray-50 border-gray-200';
  }

  static generateItemId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static createNewItem(
    name: string,
    category: string,
    quantity: number = 1,
    assignedGroupId?: string,
    isPersonal: boolean = false
  ): PackingItem {
    return {
      id: this.generateItemId(),
      name: this.sanitizeInput(name),
      category,
      quantity,
      needsToBuy: false,
      isOwned: false,
      isPacked: false,
      isPersonal,
      assignedGroupId,
      required: false,
      notes: ''
    };
  }

  static getErrorMessage(error: any, operation: string): string {
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return `Network error while ${operation}. Please check your connection and try again.`;
    }
    if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
      return `Permission denied while ${operation}. Please sign in again.`;
    }
    if (error?.message?.includes('timeout')) {
      return `Request timed out while ${operation}. Please try again.`;
    }
    return `Failed to ${operation}. Please try again.`;
  }
}
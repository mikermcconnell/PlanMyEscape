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
    return items.filter(item => 
      item.assignedGroupId === groupId || 
      (!item.assignedGroupId && !item.isPersonal)
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

  static getItemStatusIcon(item: PackingItem): string {
    if (item.isPacked) return '✅';
    if (item.isOwned) return '✓';
    if (item.needsToBuy) return '🛒';
    return '○';
  }

  static getItemStatusClass(item: PackingItem): string {
    if (item.isPacked) return 'bg-green-100 border-green-300';
    if (item.isOwned) return 'bg-blue-100 border-blue-300';
    if (item.needsToBuy) return 'bg-yellow-100 border-yellow-300';
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
      isChecked: false,
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
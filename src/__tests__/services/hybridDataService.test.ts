import { HybridDataService } from '../../services/hybridDataService';
import { supabaseDataService } from '../../services/supabaseDataService';
import { PackingItem } from '../../types';

// Mock the dependencies
jest.mock('../../services/supabaseDataService');
jest.mock('../../utils/storage', () => ({
  getPackingList: jest.fn().mockResolvedValue([]),
  savePackingList: jest.fn().mockResolvedValue(undefined),
  getMeals: jest.fn().mockResolvedValue([]),
  saveMeals: jest.fn().mockResolvedValue(undefined),
  getShoppingList: jest.fn().mockResolvedValue([]),
  saveShoppingList: jest.fn().mockResolvedValue(undefined),
  getDeletedIngredients: jest.fn().mockResolvedValue([]),
  saveDeletedIngredients: jest.fn().mockResolvedValue(undefined),
  getTodoItems: jest.fn().mockResolvedValue([]),
  saveTodoItems: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    }
  }
}));

const mockSupabaseDataService = supabaseDataService as jest.Mocked<typeof supabaseDataService>;

describe('HybridDataService', () => {
  let hybridService: HybridDataService;
  const mockTripId = 'test-trip-123';
  
  const mockPackingItems: PackingItem[] = [
    {
      id: 'item-1',
      name: 'Test Item 1',
      category: 'Shelter',
      quantity: 1,
      isOwned: true,
      needsToBuy: false,
      isPacked: false,
      required: true,
      isPersonal: false
    },
    {
      id: 'item-2', 
      name: 'Test Item 2',
      category: 'Kitchen',
      quantity: 2,
      isOwned: false,
      needsToBuy: true,
      isPacked: false,
      required: true,
      isPersonal: true,
      assignedGroupId: 'group-1'
    }
  ];

  beforeEach(() => {
    hybridService = new HybridDataService();
    jest.clearAllMocks();
  });

  describe('getPackingItems', () => {
    it('should return items from Supabase when user is signed in', async () => {
      // Mock signed in user
      jest.spyOn(hybridService as any, 'isSignedIn').mockResolvedValue(true);
      mockSupabaseDataService.getPackingItems.mockResolvedValue(mockPackingItems);

      const result = await hybridService.getPackingItems(mockTripId);

      expect(result).toEqual(mockPackingItems);
      expect(mockSupabaseDataService.getPackingItems).toHaveBeenCalledWith(mockTripId);
    });

    it('should fall back to local storage when Supabase fails', async () => {
      jest.spyOn(hybridService as any, 'isSignedIn').mockResolvedValue(true);
      mockSupabaseDataService.getPackingItems.mockRejectedValue(new Error('Supabase error'));

      const result = await hybridService.getPackingItems(mockTripId);

      expect(mockSupabaseDataService.getPackingItems).toHaveBeenCalledWith(mockTripId);
      // Should fall back to local storage (mocked to return empty array)
      expect(result).toEqual([]);
    });

    it('should use local storage when user is not signed in', async () => {
      jest.spyOn(hybridService as any, 'isSignedIn').mockResolvedValue(false);

      const result = await hybridService.getPackingItems(mockTripId);

      expect(mockSupabaseDataService.getPackingItems).not.toHaveBeenCalled();
      expect(result).toEqual([]); // Mocked local storage returns empty array
    });
  });

  describe('savePackingItems', () => {
    it('should save to Supabase when user is signed in', async () => {
      jest.spyOn(hybridService as any, 'isSignedIn').mockResolvedValue(true);
      mockSupabaseDataService.savePackingItems.mockResolvedValue();

      await hybridService.savePackingItems(mockTripId, mockPackingItems);

      expect(mockSupabaseDataService.savePackingItems).toHaveBeenCalledWith(mockTripId, mockPackingItems);
    });

    it('should remove duplicates before saving', async () => {
      jest.spyOn(hybridService as any, 'isSignedIn').mockResolvedValue(true);
      mockSupabaseDataService.savePackingItems.mockResolvedValue();

      // Create duplicate items
      const duplicateItem: PackingItem = {
        ...mockPackingItems[0]!,
        id: 'different-id' // Same name and category but different ID
      };
      const duplicateItems: PackingItem[] = [
        ...mockPackingItems,
        duplicateItem
      ];

      await hybridService.savePackingItems(mockTripId, duplicateItems);

      // Should have called save with deduplicated items
      expect(mockSupabaseDataService.savePackingItems).toHaveBeenCalled();
      const savedItems = mockSupabaseDataService.savePackingItems.mock.calls[0]?.[1];
      expect(savedItems?.length).toBe(mockPackingItems.length); // Should be deduplicated
    });
  });

  describe('duplicate removal', () => {
    it('should prioritize items with group assignments when deduplicating', () => {
      const duplicateItems: PackingItem[] = [
        {
          id: 'item-1',
          name: 'Tent',
          category: 'Shelter',
          quantity: 1,
          isOwned: true,
          needsToBuy: false,
          isPacked: false,
          required: true,
          isPersonal: false
        },
        {
          id: 'item-2',
          name: 'Tent', // Same name and category
          category: 'Shelter',
          quantity: 1,
          isOwned: true,
          needsToBuy: false,
          isPacked: false,
          required: true,
          isPersonal: false,
          assignedGroupId: 'group-1' // This one has group assignment
        }
      ];

      const result = (hybridService as any).removeDuplicatePackingItems(duplicateItems);

      expect(result).toHaveLength(1);
      expect(result[0]?.assignedGroupId).toBe('group-1'); // Should keep the one with group assignment
    });
  });
});
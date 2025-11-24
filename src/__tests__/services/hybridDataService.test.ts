import { hybridDataService } from '../../services/hybridDataService';
import { firebaseDataService } from '../../services/firebaseDataService';
import { auth } from '../../firebaseConfig';
import * as storage from '../../utils/storage';
import { Meal } from '../../types';

// Mock dependencies
jest.mock('../../services/firebaseDataService');
jest.mock('../../firebaseConfig', () => ({
    auth: {
        currentUser: null
    }
}));
jest.mock('../../utils/storage');
jest.mock('../../utils/logger', () => ({
    log: jest.fn(),
    error: jest.fn()
}));

describe('HybridDataService', () => {
    const mockTripId = 'trip-123';
    const mockMeals: Meal[] = [
        {
            id: 'meal-1',
            name: 'Breakfast',
            day: 1,
            type: 'breakfast',
            ingredients: ['Eggs', 'Bacon'],
            isCustom: false,
            sharedServings: true,
            servings: 2
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset auth state
        (auth as any).currentUser = null;
    });

    describe('getMeals', () => {
        it('should get meals from Firebase when signed in', async () => {
            // Arrange
            (auth as any).currentUser = { uid: 'user-123' };
            (firebaseDataService.getMeals as jest.Mock).mockResolvedValue(mockMeals);

            // Act
            const result = await hybridDataService.getMeals(mockTripId);

            // Assert
            expect(firebaseDataService.getMeals).toHaveBeenCalledWith(mockTripId);
            expect(result).toEqual(mockMeals);
        });

        it('should fallback to local storage when Firebase fails', async () => {
            // Arrange
            (auth as any).currentUser = { uid: 'user-123' };
            (firebaseDataService.getMeals as jest.Mock).mockRejectedValue(new Error('Firebase error'));
            (storage.getMeals as jest.Mock).mockResolvedValue(mockMeals);

            // Act
            const result = await hybridDataService.getMeals(mockTripId);

            // Assert
            expect(firebaseDataService.getMeals).toHaveBeenCalledWith(mockTripId);
            expect(storage.getMeals).toHaveBeenCalledWith(mockTripId);
            expect(result).toEqual(mockMeals);
        });

        it('should get meals from local storage when not signed in', async () => {
            // Arrange
            (auth as any).currentUser = null;
            (storage.getMeals as jest.Mock).mockResolvedValue(mockMeals);

            // Act
            const result = await hybridDataService.getMeals(mockTripId);

            // Assert
            expect(firebaseDataService.getMeals).not.toHaveBeenCalled();
            expect(storage.getMeals).toHaveBeenCalledWith(mockTripId);
            expect(result).toEqual(mockMeals);
        });
    });

    describe('saveMeals', () => {
        it('should save to Firebase and local storage when signed in', async () => {
            // Arrange
            (auth as any).currentUser = { uid: 'user-123' };
            (firebaseDataService.saveMeals as jest.Mock).mockResolvedValue(undefined);
            (storage.saveMeals as jest.Mock).mockResolvedValue(undefined);

            // Act
            await hybridDataService.saveMeals(mockTripId, mockMeals);

            // Assert
            expect(firebaseDataService.saveMeals).toHaveBeenCalledWith(mockTripId, mockMeals);
            expect(storage.saveMeals).toHaveBeenCalledWith(mockTripId, mockMeals);
        });

        it('should save locally when Firebase fails', async () => {
            // Arrange
            (auth as any).currentUser = { uid: 'user-123' };
            (firebaseDataService.saveMeals as jest.Mock).mockRejectedValue(new Error('Firebase error'));
            (storage.saveMeals as jest.Mock).mockResolvedValue(undefined);

            // Act
            await hybridDataService.saveMeals(mockTripId, mockMeals);

            // Assert
            expect(firebaseDataService.saveMeals).toHaveBeenCalledWith(mockTripId, mockMeals);
            expect(storage.saveMeals).toHaveBeenCalledWith(mockTripId, mockMeals);
        });

        it('should save locally when not signed in', async () => {
            // Arrange
            (auth as any).currentUser = null;
            (storage.saveMeals as jest.Mock).mockResolvedValue(undefined);

            // Act
            await hybridDataService.saveMeals(mockTripId, mockMeals);

            // Assert
            expect(firebaseDataService.saveMeals).not.toHaveBeenCalled();
            expect(storage.saveMeals).toHaveBeenCalledWith(mockTripId, mockMeals);
        });
    });
});
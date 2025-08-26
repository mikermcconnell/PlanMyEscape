import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, Trash2, Edit3, X, Package, Utensils, Users, Shield, Sun, Home, ShoppingCart, CheckCircle, RotateCcw, StickyNote, Activity, Save, Download, Upload } from 'lucide-react';
import { PackingItem, Trip, TripType, PackingTemplate } from '../types';
import { hybridDataService } from '../services/hybridDataService';
import { getPackingListDescription, getPackingTemplate } from '../data/packingTemplates';
import { separateAndItems, PackingSuggestion } from '../data/activityEquipment';
import ShoppingList from '../components/ShoppingList';
import SEOHead from '../components/SEOHead';
import { createPackingTemplate, loadPackingTemplate, filterCompatibleTemplates, getPackingTemplateSummary } from '../utils/templateHelpers';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

// ----------------------------------
// Constants
// ----------------------------------
// Packing categories never change, so defining them at module level keeps
// the array identity stable across renders and eliminates 'missing dependency' warnings.
export const PACKING_CATEGORIES = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Safety', 'Transportation', 'Fun and games', 'Other'] as const;


const PackingList = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [items, setItems] = useState<PackingItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const groupOptions = [{ id: 'all', name: 'All' as const }, ...trip.groups];
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const categories = PACKING_CATEGORIES;
  const [addItemModal, setAddItemModal] = useState<{ 
    show: boolean; 
    category: string; 
    name: string; 
    quantity: number; 
    assignedGroupId?: string; 
    isPersonal: boolean;
  }>({ show: false, category: '', name: '', quantity: 1, isPersonal: false });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Template management state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PackingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');

  // Ref to keep track of the current timeout across renders
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced error message helper
  const getErrorMessage = (error: any, operation: string): string => {
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
  };

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => setUpdateError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError]);

  // Input validation and sanitization helper
  const validateAndSanitizeInput = (input: string, fieldName: string, maxLength: number = 100): string | null => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      return `${fieldName} cannot be empty`;
    }
    
    if (trimmed.length > maxLength) {
      return `${fieldName} is too long (max ${maxLength} characters)`;
    }
    
    // Basic XSS prevention: remove script tags and suspicious patterns
    if (trimmed.match(/<script.*?>.*?<\/script>/gi) || trimmed.match(/javascript:/gi) || trimmed.match(/on\w+=/gi)) {
      return `${fieldName} contains invalid characters`;
    }
    
    return null; // No errors
  };

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .slice(0, 200); // Hard limit for safety
  };

  // Controlled logging for production
  const DEBUG = process.env.NODE_ENV === 'development';
  const log = (message: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(message, ...args);
    }
  };

  const logError = (message: string, error?: any) => {
    // Always log errors, but format differently for production
    if (DEBUG) {
      console.error(message, error);
    } else {
      console.error(message); // Don't include sensitive error details in production
    }
  };

  // Immediate save function to prevent data loss on navigation
  const immediateSave = useCallback(
    async (tripId: string, items: PackingItem[]) => {
      try {
        await hybridDataService.savePackingItems(tripId, items);
        log('PackingList: Immediate save completed');
      } catch (error) {
        logError('Failed to save packing list:', error);
        setUpdateError('Failed to save packing list. Please try again.');
      }
    },
    []
  );

  // Debounced save function for typing - shorter timeout
  const debouncedSave = useCallback(
    (tripId: string, items: PackingItem[]) => {
      // Always clear previous timeout to prevent memory leaks
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await hybridDataService.savePackingItems(tripId, items);
          saveTimeoutRef.current = null; // Clear reference after completion
        } catch (error) {
          logError('Failed to save packing list:', error);
          setUpdateError('Failed to save packing list. Please try again.');
          saveTimeoutRef.current = null; // Clear reference even on error
        }
      }, 150); // Reduced from 300ms to 150ms
    },
    []
  );

  // Memoized function to update items state and trigger save
  const updateItems = useCallback(
    (newItems: PackingItem[], immediate = false) => {
      setItems(newItems);
      if (immediate) {
        // For critical operations like status toggles, save immediately
        immediateSave(tripId, newItems);
      } else {
        // For typing/editing, use debounced save
        debouncedSave(tripId, newItems);
      }
    },
    [tripId, debouncedSave, immediateSave]
  );

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // Separate effect for unmount save to prevent race conditions
  useEffect(() => {
    const currentItems = items;
    const currentTripId = tripId;
    
    return () => {
      if (currentItems.length > 0) {
        hybridDataService.savePackingItems(currentTripId, currentItems).catch(error => {
          logError('Failed to save on unmount:', error);
        });
      }
    };
  }, []); // Only capture initial values

  // Add proper useMemo with typed parameters
  const displayedItems = useMemo(() =>
    selectedGroupId === 'all'
      ? items
      : items.filter((i: PackingItem) => i.assignedGroupId === selectedGroupId),
    [items, selectedGroupId]);

  // Separate items by packed status first, then by personal/group
  const unpackedItems = useMemo(() => displayedItems.filter((item: PackingItem) => !item.isPacked), [displayedItems]);
  const packedItems = useMemo(() => displayedItems.filter((item: PackingItem) => item.isPacked), [displayedItems]);
  
  const unpackedPersonalItems = useMemo(() => unpackedItems.filter((item: PackingItem) => item.isPersonal), [unpackedItems]);
  const unpackedGroupItems = useMemo(() => unpackedItems.filter((item: PackingItem) => !item.isPersonal), [unpackedItems]);
  const packedPersonalItems = useMemo(() => packedItems.filter((item: PackingItem) => item.isPersonal), [packedItems]);
  const packedGroupItems = useMemo(() => packedItems.filter((item: PackingItem) => !item.isPersonal), [packedItems]);
  
  const groupedUnpackedPersonalItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = unpackedPersonalItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [unpackedPersonalItems, categories]);
  
  const groupedUnpackedGroupItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = unpackedGroupItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [unpackedGroupItems, categories]);

  const groupedPackedPersonalItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = packedPersonalItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [packedPersonalItems, categories]);
  
  const groupedPackedGroupItems = useMemo(() =>
    categories.reduce((acc: Record<string, PackingItem[]>, category: string) => {
      acc[category] = packedGroupItems.filter((item: PackingItem) => item.category === category);
      return acc;
    }, {} as Record<string, PackingItem[]>)
  , [packedGroupItems, categories]);

  const totalItems = displayedItems.length;
  const ownedItems = displayedItems.filter((item: PackingItem) => item.isOwned).length;
  const needToBuyItems = displayedItems.filter((item: PackingItem) => item.needsToBuy).length;
  const packedItemsCount = packedItems.length;
  const renderTripTypeText = (type: TripType): string => {
    switch (type) {
      case 'car camping':
        return 'Car Camping';
      case 'canoe camping':
        return 'Canoe Camping';
      case 'hike camping':
        return 'Hike Camping';
      case 'cottage':
        return 'Cottage';
      default:
        return 'Trip';
    }
  };

  const assignItemToGroup = (itemId: string, groupId: string | undefined) => {
    const updatedItems = items.map((item: PackingItem) => {
      if (item.id === itemId) {
        return {
          ...item,
          assignedGroupId: groupId
        };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const openAddItemModal = (category: string, assignedGroupId?: string, isPersonal: boolean = false) => {
    setAddItemModal({ 
      show: true, 
      category: category, 
      name: '', 
      quantity: 1,
      assignedGroupId: assignedGroupId,
      isPersonal: isPersonal
    });
  };

  const closeAddItemModal = () => {
    setAddItemModal({ show: false, category: '', name: '', quantity: 1, isPersonal: false });
  };

  const addItemFromModal = async () => {
    try {
      // Validate input
      const validationError = validateAndSanitizeInput(addItemModal.name, 'Item name');
      if (validationError) {
        setUpdateError(validationError);
        return;
      }

      // Validate quantity
      if (addItemModal.quantity < 1 || addItemModal.quantity > 999) {
        setUpdateError('Quantity must be between 1 and 999');
        return;
      }

      setHasUserInteracted(true); // Mark that user has interacted
      
      // Sanitize the input
      const sanitizedName = sanitizeInput(addItemModal.name);
      
      // Create a suggestion object to use the separateAndItems function
      const suggestions = separateAndItems([{
        name: sanitizedName,
        category: addItemModal.category,
        required: false,
        quantity: addItemModal.quantity
      }]);
      
      // Create packing items from the separated suggestions
      const newItems: PackingItem[] = suggestions.map((suggestion: PackingSuggestion) => ({
        id: crypto.randomUUID(),
        name: suggestion.name,
        category: suggestion.category,
        quantity: suggestion.quantity || 1,
        isChecked: false,
        weight: undefined,
        isOwned: false,
        needsToBuy: false,
        isPacked: false,
        required: suggestion.required,
        assignedGroupId: addItemModal.assignedGroupId,
        isPersonal: addItemModal.isPersonal
      }));
      
      // Add to the current items list
      const updatedItems = [...items, ...newItems];
      updateItems(updatedItems);
      
      // Reset the form
      closeAddItemModal();
      
    } catch (error) {
      logError('Failed to add item:', error);
      setUpdateError(getErrorMessage(error, 'add item'));
    }
  };

  const updateAddFormField = (field: 'name' | 'quantity', value: string | number) => {
    setAddItemModal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalCampers = (trip: Trip): number => {
    return trip.groups.reduce((total, group) => total + group.size, 0);
  };

  const resetToTemplate = async () => {
    setIsLoading(true);
    try {
      const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);
      const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const templateItems = getPackingTemplate(trip.tripType, totalCampers, tripDays);
      
      // Preserve user status changes when resetting to template
      const existingItemsMap: { [key: string]: PackingItem } = {};
      items.forEach(item => {
        existingItemsMap[item.name.toLowerCase()] = item;
      });
      
      const mergedItems = templateItems.map(templateItem => {
        const existingItem = existingItemsMap[templateItem.name.toLowerCase()];
        
        if (existingItem) {
          // Preserve user status changes but update template properties
          return {
            ...templateItem, // Use template structure
            id: existingItem.id, // Keep existing ID
            isOwned: existingItem.isOwned, // Preserve owned status
            needsToBuy: existingItem.needsToBuy, // Preserve shopping status
            isPacked: existingItem.isPacked, // Preserve packed status
            isChecked: existingItem.isChecked, // Preserve checked status
            notes: existingItem.notes, // Preserve user notes
            assignedGroupId: existingItem.assignedGroupId // Preserve group assignments
          };
        }
        
        return templateItem; // New template item
      });
      
      // Save the merged items and set them through updateItems for consistency
      updateItems(mergedItems);
      setCurrentTemplateName(`Default ${renderTripTypeText(trip.tripType)} List`);
      setLoadedTemplateName(''); // Clear loaded template name when resetting to default
      
      setConfirmation('Template updated while preserving your status changes!');
      setTimeout(() => setConfirmation(null), 3000);
    } catch (error) {
      logError('Failed to reset to template:', error);
      setUpdateError(getErrorMessage(error, 'reset to template'));
    } finally {
      setIsLoading(false);
    }
  };



  // Track if data has been loaded to prevent re-initialization
  const [hasLoaded, setHasLoaded] = useState(false);
  // Track if user has interacted with the list (to prevent template overrides)
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Track if template is currently being created to prevent race conditions
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  // Reset state when trip changes
  useEffect(() => {
    setHasLoaded(false);
    setHasUserInteracted(false);
    setIsCreatingTemplate(false);
    log('🔄 Trip changed, resetting packing list state');
  }, [tripId]);

  // Load the packing list from storage (only when tripId changes, not trip object)
  useEffect(() => {
    const loadPackingList = async () => {
      if (!tripId || hasLoaded || isCreatingTemplate) {
        log(`⏭️ Skipping load: tripId=${tripId}, hasLoaded=${hasLoaded}, isCreatingTemplate=${isCreatingTemplate}`);
        return; // Prevent reload if already loaded or template creation in progress
      }
      
      log('📥 Loading packing list for trip:', tripId);
      
      try {
        const savedItems = await hybridDataService.getPackingItems(tripId);
        log(`📦 Found ${savedItems.length} existing packing items`);
        
        // CRITICAL: Only create template if NO items exist AND no template creation is in progress
        if (savedItems.length === 0 && trip && !hasUserInteracted && !isCreatingTemplate) {
          log('🔨 No packing items found, creating template...');
          setIsCreatingTemplate(true); // Prevent concurrent template creation
          
          try {
            const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);
            const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
            const templateItems = getPackingTemplate(trip.tripType, totalCampers, tripDays);
            
            log(`🎯 Creating ${templateItems.length} template items for ${trip.tripType} trip`);
            
            // Set items directly and save them
            setItems(templateItems);
            await hybridDataService.savePackingItems(tripId, templateItems);
            setCurrentTemplateName(`Default ${renderTripTypeText(trip.tripType)} List`);
            setLoadedTemplateName(''); // Clear any loaded template when creating new default
            log(`✅ Created and saved ${templateItems.length} template items`);
          } catch (templateError) {
            logError('❌ Failed to create template:', templateError);
            setUpdateError('Failed to create packing template. Please try again.');
          } finally {
            setIsCreatingTemplate(false);
          }
        } else if (savedItems.length > 0) {
          log(`📦 Loading ${savedItems.length} existing packing items from database`);
          setItems(savedItems);
          // If loading existing items and no template name is set, set it to 'Custom List'
          if (!currentTemplateName) {
            setCurrentTemplateName('Custom List');
          }
        } else {
          log('⏭️ Skipping template creation - conditions not met');
        }
        
        setHasLoaded(true); // Mark as loaded
      } catch (error) {
        logError('❌ Failed to load packing list:', error);
        setUpdateError('Failed to load packing list. Please refresh the page.');
        setIsCreatingTemplate(false);
      }
    };
    
    loadPackingList();
  }, [tripId, hasLoaded, isCreatingTemplate]); // Limited dependencies to prevent excessive re-runs

  const toggleOwned = async (itemId: string) => {
    const originalItems = [...items]; // Backup for error recovery
    
    try {
      setHasUserInteracted(true); // Mark that user has interacted
      const item = items.find(item => item.id === itemId);
      if (!item) {
        setUpdateError('Item not found. Please refresh the page.');
        return;
      }

      const newIsOwned = !item.isOwned;
      
      log(`🎯 Toggling owned status for ${item.name}: ${item.isOwned} → ${newIsOwned}`);
      
      // Optimistically update UI first
      const updatedItems = items.map(itemToUpdate => {
        if (itemToUpdate.id === itemId) {
          return {
            ...itemToUpdate,
            isOwned: newIsOwned,
            // When marking as owned, also set needsToBuy to false
            needsToBuy: newIsOwned ? false : itemToUpdate.needsToBuy
          };
        }
        return itemToUpdate;
      });
      
      // Optimistically update local state
      setItems(updatedItems);
      
      // If marking as owned, remove from shopping list
      if (newIsOwned) {
        try {
          const shoppingList = await hybridDataService.getShoppingItems(tripId);
          const shoppingItem = shoppingList.find(shopItem => shopItem.sourceItemId === itemId);
          if (shoppingItem) {
            const updatedShoppingList = shoppingList.filter(item => item.id !== shoppingItem.id);
            await hybridDataService.saveShoppingItems(tripId, updatedShoppingList);
            // Show confirmation message
            setConfirmation(`${item.name} removed from shopping list!`);
            setTimeout(() => setConfirmation(null), 2000);
          }
        } catch (shoppingError) {
          logError('Failed to remove from shopping list:', shoppingError);
          // Don't fail the main operation for shopping list errors
        }
      }
      
      // Save the main item changes
      log(`💾 Saving owned status change immediately...`);
      await hybridDataService.savePackingItems(tripId, updatedItems);
      log(`✅ Owned status saved successfully for ${item.name}`);
      
    } catch (error) {
      logError(`❌ Failed to save owned status for item:`, error);
      setUpdateError(getErrorMessage(error, 'update item status'));
      // Revert the UI change on error
      setItems(originalItems);
    }
  };

  const toggleNeedsToBuy = async (itemId: string) => {
    setHasUserInteracted(true); // Mark that user has interacted
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    const newNeedsToBuy = !item.needsToBuy;
    log(`🛒 [PackingList] Toggling needsToBuy for ${item.name}: ${item.needsToBuy} → ${newNeedsToBuy}`);

    const updatedItems = items.map(itemToUpdate => {
      if (itemToUpdate.id === itemId) {
        return {
          ...itemToUpdate,
          needsToBuy: newNeedsToBuy,
          // When marking as needsToBuy, also set isOwned to false
          isOwned: newNeedsToBuy ? false : itemToUpdate.isOwned
        };
      }
      return itemToUpdate;
    });
    
    // Show confirmation message - the shopping list will be automatically updated by the HybridDataService
    setConfirmation(newNeedsToBuy ? `${item.name} added to shopping list!` : `${item.name} removed from shopping list!`);
    setTimeout(() => setConfirmation(null), 2000);
    
    updateItems(updatedItems, true); // Save immediately for status changes
  };

  const togglePacked = async (itemId: string) => {
    const originalItems = [...items]; // Backup for error recovery
    
    try {
      setHasUserInteracted(true); // Mark that user has interacted
      const item = items.find(item => item.id === itemId);
      if (!item) {
        setUpdateError('Item not found. Please refresh the page.');
        return;
      }
      
      const newIsPacked = !item.isPacked;
      log(`🎯 Toggling packed status for ${item.name}: ${item.isPacked} → ${newIsPacked}`);
      
      // Optimistically update UI first
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isPacked: newIsPacked
          };
        }
        return item;
      });
      
      // Optimistically update local state
      setItems(updatedItems);
      
      // Save changes
      log(`💾 Saving packed status change immediately...`);
      await hybridDataService.savePackingItems(tripId, updatedItems);
      log(`✅ Packed status saved successfully for ${item.name}`);
      
    } catch (error) {
      logError(`❌ Failed to save packed status for item:`, error);
      setUpdateError(getErrorMessage(error, 'update item status'));
      // Revert the UI change on error
      setItems(originalItems);
    }
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    updateItems(updatedItems);
  };

  const updateItem = async (itemId: string, updates: Partial<PackingItem>) => {
    try {
      // Validate name updates if provided
      if (updates.name !== undefined) {
        const validationError = validateAndSanitizeInput(updates.name, 'Item name');
        if (validationError) {
          setUpdateError(validationError);
          return;
        }
        // Sanitize the name
        updates.name = sanitizeInput(updates.name);
      }

      // Validate quantity updates if provided
      if (updates.quantity !== undefined && (updates.quantity < 1 || updates.quantity > 999)) {
        setUpdateError('Quantity must be between 1 and 999');
        return;
      }

      // Validate notes if provided
      if (updates.notes !== undefined && updates.notes.length > 500) {
        setUpdateError('Notes are too long (max 500 characters)');
        return;
      }

      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return item;
      });
      updateItems(updatedItems);
      
    } catch (error) {
      logError('Failed to update item:', error);
      setUpdateError(getErrorMessage(error, 'update item'));
    }
  };

  const deleteItem = async (itemId: string) => {
    setHasUserInteracted(true); // Mark that user has interacted
    const updatedItems = items.filter(item => item.id !== itemId);
    updateItems(updatedItems);
  };

  const startEditingNotes = (itemId: string, currentNotes?: string) => {
    setEditingNotes(itemId);
    setNotesText(currentNotes || '');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const saveNotes = async (itemId: string) => {
    await updateItem(itemId, { notes: notesText.trim() || undefined });
    setEditingNotes(null);
    setNotesText('');
  };

  const clearUserInput = async () => {
    // Reset all items' status icons to their default state (keep all items, just reset status)
    const clearedItems = items.map(item => ({
      ...item,
      isOwned: false,
      needsToBuy: false, // Reset needsToBuy to false
      isPacked: false,
      assignedGroupId: undefined
    }));
    
    updateItems(clearedItems);
    
    // Also clear shopping items that were added from this packing list
    const shoppingItems = await hybridDataService.getShoppingItems(tripId);
    const filteredShoppingItems = shoppingItems.filter(item => !item.sourceItemId);
    await hybridDataService.saveShoppingItems(tripId, filteredShoppingItems);
    
    setShowClearConfirmation(false);
  };

  // Template management functions
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templates = await hybridDataService.getPackingTemplates();
      const compatibleTemplates = filterCompatibleTemplates(templates, trip.tripType);
      setAvailableTemplates(compatibleTemplates);
    } catch (error) {
      setUpdateError('Failed to load templates. Please try again.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const saveAsTemplate = async () => {
    if (items.length === 0) {
      setUpdateError('Cannot save empty packing list as template');
      return;
    }

    setSavingTemplate(true);
    try {
      const template = createPackingTemplate(trip.tripName, trip.tripType, items);
      await hybridDataService.savePackingTemplate(template);
      setConfirmation(`Packing list saved as "${trip.tripName}" template!`);
      setTimeout(() => setConfirmation(null), 3000);
    } catch (error) {
      setUpdateError(getErrorMessage(error, 'saving template'));
    } finally {
      setSavingTemplate(false);
    }
  };

  const loadTemplate = async (template: PackingTemplate) => {
    setIsLoading(true);
    try {
      const templateItems = loadPackingTemplate(template, tripId, trip);
      // Replace existing items with template items (don't concatenate)
      setItems(templateItems);
      await hybridDataService.savePackingItems(tripId, templateItems);
      setCurrentTemplateName(`Default ${renderTripTypeText(trip.tripType)} List`); // Keep the base template name
      setLoadedTemplateName(template.name); // Track the loaded saved template
      setShowTemplateModal(false);
      setConfirmation(`Loaded "${template.name}" packing list!`);
      setTimeout(() => setConfirmation(null), 3000);
    } catch (error) {
      setUpdateError(getErrorMessage(error, 'loading template'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Activity Items':
        return <Activity className="h-5 w-5 mr-2" />;
      case 'Fun and games':
        return <Activity className="h-5 w-5 mr-2" />;
      case 'Shelter':
        return <Home className="h-5 w-5 mr-2" />;
      case 'Kitchen':
        return <Utensils className="h-5 w-5 mr-2" />;
      case 'Clothing':
        return <Users className="h-5 w-5 mr-2" />;
      case 'Personal':
        return <Shield className="h-5 w-5 mr-2" />;
      case 'Tools':
        return <Package className="h-5 w-5 mr-2" />;
      case 'Sleep':
        return <Sun className="h-5 w-5 mr-2" />;
      case 'Comfort':
        return <Home className="h-5 w-5 mr-2" />;
      case 'Pack':
        return <Package className="h-5 w-5 mr-2" />;
      case 'Food':
        return <Utensils className="h-5 w-5 mr-2" />;
      default:
        return <Package className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <div className="mx-auto w-full md:max-w-5xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow p-4 sm:p-8">
      <SEOHead 
        title={`Packing List - ${trip.tripName} | PlanMyEscape`}
        description={`Organize and track your packing list for ${trip.tripName}. Never forget essential camping gear with our smart packing checklist.`}
        keywords="camping packing list, outdoor gear checklist, trip packing, camping essentials"
        url={`https://planmyescape.ca/trip/${trip.id}/packing`}
      />
      {updateError && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {updateError}
        </div>
      )}

      {/* Group selector tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {groupOptions.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGroupId(g.id)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${selectedGroupId === g.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600/50'}`}
          >
            {g.name === 'All' ? 'All Items' : `${g.name} list`}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Packing List
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {trip.tripName} • {renderTripTypeText(trip.tripType)} • {calculateTotalCampers(trip)} person{calculateTotalCampers(trip) > 1 ? 's' : ''}
            </p>
            {currentTemplateName && (
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                <Package className="h-3 w-3 inline mr-1" />
                Current List: {currentTemplateName}
                {loadedTemplateName && (
                  <span className="ml-1 text-blue-600 dark:text-blue-400">
                    (Loaded: {loadedTemplateName})
                  </span>
                )}
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              {getPackingListDescription(trip.tripType)}
            </p>
            {trip.isCoordinated && (
              <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-400 mt-1">
                <Users className="h-4 w-4 inline mr-1" />
                Items can be assigned to specific groups
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center sm:items-start">
            <button
              onClick={resetToTemplate}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  <span className="hidden sm:inline">Updating Template...</span>
                  <span className="sm:hidden">Updating...</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Use Default List</span>
                  <span className="sm:hidden">Reset Template</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                loadTemplates();
                setShowTemplateModal(true);
              }}
              disabled={loadingTemplates}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingTemplates ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Load Saved List</span>
                  <span className="sm:hidden">Load Template</span>
                </>
              )}
            </button>
            <button
              onClick={saveAsTemplate}
              disabled={savingTemplate || items.length === 0}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {savingTemplate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Save This List</span>
                  <span className="sm:hidden">Save Template</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
              Clear Status Icons
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{packedItemsCount}/{totalItems}</div>
            <div className="text-sm text-gray-500">Packed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{ownedItems}/{totalItems}</div>
            <div className="text-sm text-gray-500">Owned</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{needToBuyItems}</div>
            <div className="text-sm text-gray-500">Need to Buy</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Icons</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="p-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 mr-2">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Need to Buy</span>
            </div>
            <div className="flex items-center">
              <div className="p-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mr-2">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Owned</span>
            </div>
            <div className="flex items-center">
              <div className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 mr-2">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Packed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clear Status Icons
              </h3>
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will reset all status icons (owned, needs to buy, packed) back to their default state while keeping all items. Items marked as "need to buy" will also be removed from the shopping list.
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={clearUserInput}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Clear Status Icons
                </button>
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addItemModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Item to {addItemModal.category}
              </h3>
              <button
                onClick={closeAddItemModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="Item name"
                  value={addItemModal.name}
                  onChange={(e) => updateAddFormField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={addItemModal.quantity}
                  onChange={(e) => updateAddFormField('quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={addItemFromModal}
                  disabled={!addItemModal.name.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
                <button
                  onClick={closeAddItemModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packing List */}
      <div className="space-y-8">
        {/* Unpacked Personal Items Section */}
        {unpackedPersonalItems.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Personal Items (Per Person)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Each person in your group needs their own
              </p>
            </div>
            {categories.map(category => {
              const categoryItems: PackingItem[] = groupedUnpackedPersonalItems[category] ?? [];
              if (categoryItems.length === 0) return null;

              return (
                <div key={`personal-${category}`} className="bg-white dark:bg-gray-800 shadow rounded-lg pt-8">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2">{category}</span>
                      </h3>
                      <button
                        onClick={() => openAddItemModal(category, selectedGroupId !== 'all' ? selectedGroupId : undefined, true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryItems.map((item: PackingItem) => (
                      <div key={item.id} className="px-3 sm:px-6 py-4">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          <div className="space-y-3">
                            {/* Top row: Status buttons and item name */}
                            <div className="flex items-center space-x-2">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-1">
                                {!item.isOwned && (
                                  <button
                                    onClick={() => toggleNeedsToBuy(item.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                      item.needsToBuy 
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                    title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleOwned(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isOwned 
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isOwned ? "You own this item" : "Mark as owned"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => togglePacked(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isPacked 
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isPacked ? "Item is packed" : "Mark as packed"}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                              
                              {/* Item name and details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setEditingItem(item.id)}
                                  className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
                                >
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className={`${
                                        item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                      } text-sm break-words`}>
                                        {item.name}
                                      </span>
                                    </div>
                                    {item.quantity > 1 && (
                                      <span className="text-xs text-gray-500 ml-2">×{item.quantity}</span>
                                    )}
                                    {item.weight && (
                                      <span className="text-xs text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Edit, Notes, and Delete buttons */}
                              {editingItem !== item.id && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setEditingItem(item.id)}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingNotes(item.id, item.notes);
                                    }}
                                    className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Notes editing section */}
                            {editingNotes === item.id && (
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                  <StickyNote className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                                </div>
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add notes about this item..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => saveNotes(item.id)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Display existing notes */}
                            {item.notes && editingNotes !== item.id && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                  <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Bottom row: Group assignment and status badges */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {/* Group Assignment */}
                                {trip.isCoordinated && (
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-xs border rounded-md py-1 px-2 dark:bg-gray-700"
                                    style={{
                                      borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                      color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                    }}
                                  >
                                    <option value="">Shared</option>
                                    {trip.groups.map((group) => (
                                      <option key={group.id} value={group.id}>
                                        {group.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex items-center space-x-1">
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Buy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-2">
                                {!item.isOwned && (
                                  <button
                                    onClick={() => toggleNeedsToBuy(item.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                      item.needsToBuy 
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                    title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleOwned(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isOwned 
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isOwned ? "You own this item" : "Mark as owned"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => togglePacked(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isPacked 
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isPacked ? "Item is packed" : "Mark as packed"}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                              {/* Item Details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                                    style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                  <div 
                                    onClick={() => setEditingItem(item.id)}
                                    className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center"
                                  >
                                    <span className={`${
                                      item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                    } break-words max-w-[300px]`}>
                                      {item.name}
                                    </span>
                                    {item.quantity > 1 && (
                                      <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                                    )}
                                    {item.weight && (
                                      <span className="text-sm text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                                    )}
                                  </div>
                                  {/* Group Assignment */}
                                  {trip.isCoordinated && (
                                    <select
                                      value={item.assignedGroupId || ''}
                                      onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                      className="text-sm border rounded-md py-1 px-2 dark:bg-gray-700 ml-2"
                                      style={{
                                        borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                        color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                      }}
                                    >
                                      <option value="">Shared</option>
                                      {trip.groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                          {group.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => setEditingItem(item.id)}
                                      className="text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingNotes(item.id, item.notes);
                                      }}
                                      className={`${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                    >
                                      <StickyNote className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteItem(item.id);
                                      }}
                                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  {/* Status Badge */}
                                  {item.isOwned && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Owned
                                    </span>
                                  )}
                                  {item.needsToBuy && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                      <ShoppingCart className="h-3 w-3 mr-1" />
                                      Need to Buy
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Notes editing section for desktop */}
                          {editingNotes === item.id && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 mb-2">
                                <StickyNote className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                              </div>
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes about this item..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => saveNotes(item.id)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Display existing notes for desktop */}
                          {item.notes && editingNotes !== item.id && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-2">
                                <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unpacked Group Items Section */}
        {unpackedGroupItems.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Group Items (Shared by Everyone)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your group only needs one of each of these items
              </p>
            </div>
            {categories.map(category => {
              const categoryItems: PackingItem[] = groupedUnpackedGroupItems[category] ?? [];
              if (categoryItems.length === 0) return null;

              return (
                <div key={`group-${category}`} className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2">{category}</span>
                      </h3>
                      <button
                        onClick={() => openAddItemModal(category, selectedGroupId !== 'all' ? selectedGroupId : undefined, false)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryItems.map((item: PackingItem) => (
                      <div key={item.id} className="px-3 sm:px-6 py-4">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          <div className="space-y-3">
                            {/* Top row: Status buttons and item name */}
                            <div className="flex items-center space-x-2">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-1">
                                {!item.isOwned && (
                                  <button
                                    onClick={() => toggleNeedsToBuy(item.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                      item.needsToBuy 
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                    title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleOwned(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isOwned 
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isOwned ? "You own this item" : "Mark as owned"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => togglePacked(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isPacked 
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isPacked ? "Item is packed" : "Mark as packed"}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                              
                              {/* Item name and details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setEditingItem(item.id)}
                                  className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
                                >
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className={`${
                                        item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                      } text-sm break-words`}>
                                        {item.name}
                                      </span>
                                    </div>
                                    {item.quantity > 1 && (
                                      <span className="text-xs text-gray-500 ml-2">×{item.quantity}</span>
                                    )}
                                    {item.weight && (
                                      <span className="text-xs text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Edit, Notes, and Delete buttons */}
                              {editingItem !== item.id && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setEditingItem(item.id)}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingNotes(item.id, item.notes);
                                    }}
                                    className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(item.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Notes editing section */}
                            {editingNotes === item.id && (
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                  <StickyNote className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                                </div>
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add notes about this item..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => saveNotes(item.id)}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingNotes}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Display existing notes */}
                            {item.notes && editingNotes !== item.id && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                  <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Bottom row: Group assignment and status badges */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {/* Group Assignment */}
                                {trip.isCoordinated && (
                                  <select
                                    value={item.assignedGroupId || ''}
                                    onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                    className="text-xs border rounded-md py-1 px-2 dark:bg-gray-700"
                                    style={{
                                      borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                      color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                    }}
                                  >
                                    <option value="">Shared</option>
                                    {trip.groups.map((group) => (
                                      <option key={group.id} value={group.id}>
                                        {group.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              
                              {/* Status Badges */}
                              <div className="flex items-center space-x-1">
                                {item.isOwned && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Owned
                                  </span>
                                )}
                                {item.needsToBuy && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Buy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Status Buttons */}
                              <div className="flex items-center space-x-2">
                                {!item.isOwned && (
                                  <button
                                    onClick={() => toggleNeedsToBuy(item.id)}
                                    className={`p-1 rounded-full transition-colors ${
                                      item.needsToBuy 
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                    title={item.needsToBuy ? "Need to buy this item" : "Mark as need to buy"}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleOwned(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isOwned 
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isOwned ? "You own this item" : "Mark as owned"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => togglePacked(item.id)}
                                  className={`p-1 rounded-full transition-colors ${
                                    item.isPacked 
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                  }`}
                                  title={item.isPacked ? "Item is packed" : "Mark as packed"}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                              {/* Item Details */}
                              {editingItem === item.id ? (
                                <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                                    style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                                  />
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 flex-1 max-w-xl">
                                  <div 
                                    onClick={() => setEditingItem(item.id)}
                                    className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center"
                                  >
                                    <span className={`${
                                      item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                    } break-words max-w-[300px]`}>
                                      {item.name}
                                    </span>
                                    {item.quantity > 1 && (
                                      <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                                    )}
                                    {item.weight && (
                                      <span className="text-sm text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                                    )}
                                  </div>
                                  {/* Group Assignment */}
                                  {trip.isCoordinated && (
                                    <select
                                      value={item.assignedGroupId || ''}
                                      onChange={(e) => assignItemToGroup(item.id, e.target.value || undefined)}
                                      className="text-sm border rounded-md py-1 px-2 dark:bg-gray-700 ml-2"
                                      style={{
                                        borderColor: trip.groups.find(g => g.id === item.assignedGroupId)?.color || 'transparent',
                                        color: trip.groups.find(g => g.id === item.assignedGroupId)?.color
                                      }}
                                    >
                                      <option value="">Shared</option>
                                      {trip.groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                          {group.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => setEditingItem(item.id)}
                                      className="text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingNotes(item.id, item.notes);
                                      }}
                                      className={`${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                    >
                                      <StickyNote className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteItem(item.id);
                                      }}
                                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  {/* Status Badge */}
                                  {item.isOwned && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Owned
                                    </span>
                                  )}
                                  {item.needsToBuy && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                      <ShoppingCart className="h-3 w-3 mr-1" />
                                      Need to Buy
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Notes editing section for desktop */}
                          {editingNotes === item.id && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 mb-2">
                                <StickyNote className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
                              </div>
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes about this item..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => saveNotes(item.id)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Display existing notes for desktop */}
                          {item.notes && editingNotes !== item.id && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-2">
                                <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Packed Items Section */}
        {packedItems.length > 0 && (
          <div className="space-y-6 mt-12">
            <div className="border-b border-gray-300 dark:border-gray-600 pb-2">
              <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Packed Items
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Items that have been packed for the trip
              </p>
            </div>

            {/* Packed Personal Items */}
            {packedPersonalItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Personal Items
                </h3>
                {categories.map(category => {
                  const categoryItems: PackingItem[] = groupedPackedPersonalItems[category] ?? [];
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={`packed-personal-${category}`} className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            {getCategoryIcon(category)}
                            <span className="ml-2">{category}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {categoryItems.map((item: PackingItem) => (
                          <div key={item.id} className="px-3 sm:px-6 py-3 opacity-75">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-gray-600 dark:text-gray-400 line-through">
                                  {item.name}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-xs text-gray-500">×{item.quantity}</span>
                                )}
                              </div>
                              <button
                                onClick={() => togglePacked(item.id)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Unpack this item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Packed Group Items */}
            {packedGroupItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Group Items
                </h3>
                {categories.map(category => {
                  const categoryItems: PackingItem[] = groupedPackedGroupItems[category] ?? [];
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={`packed-group-${category}`} className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            {getCategoryIcon(category)}
                            <span className="ml-2">{category}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {categoryItems.map((item: PackingItem) => (
                          <div key={item.id} className="px-3 sm:px-6 py-3 opacity-75">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-gray-600 dark:text-gray-400 line-through">
                                  {item.name}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-xs text-gray-500">×{item.quantity}</span>
                                )}
                              </div>
                              <button
                                onClick={() => togglePacked(item.id)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Unpack this item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shopping List Modal */}
      {showShoppingList && tripId && (
        <ShoppingList 
          tripId={tripId}
          groups={trip.groups}
          onClose={() => setShowShoppingList(false)} 
        />
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Choose a Saved List
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a packing list template to add to your current list. Items from the template will be added to your existing items.
            </p>
            
            {availableTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No compatible templates found</p>
                <p className="text-sm text-gray-500">
                  Create your first template by customizing your packing list and clicking "Save This List"
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {template.tripType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {getPackingTemplateSummary(template)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => loadTemplate(template)}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Load Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {confirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {confirmation}
        </div>
      )}
    </div>
  );
};

export default PackingList; 
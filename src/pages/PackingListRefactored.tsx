import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2, RotateCcw, Save, ShoppingCart, Search, Users } from 'lucide-react';
import { PackingItem, Trip, PackingTemplate } from '../types';
import { usePackingItems } from '../hooks/usePackingItems';
import { usePackingTemplates } from '../hooks/usePackingTemplates';
import { PackingListService } from '../services/packingListService';
import { PackingCategory } from '../components/packing/PackingCategory';
import { AddItemModal } from '../components/packing/AddItemModal';
import { PackingProgress } from '../components/packing/PackingProgress';
import { getPackingListDescription, getPackingTemplate } from '../data/packingTemplates';
import ShoppingList from '../components/ShoppingList';
import SEOHead from '../components/SEOHead';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

export const PACKING_CATEGORIES = [
  'Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 
  'Sleep', 'Comfort', 'Pack', 'Safety', 'Transportation', 
  'Fun and games', 'Other'
] as const;

const PackingListRefactored: React.FC = () => {
  const { trip } = useOutletContext<TripContextType>();
  const { 
    items, 
    updateItems, 
    isLoading, 
    error: itemsError, 
    clearError 
  } = usePackingItems(trip.id);
  
  const {
    availableTemplates,
    loadingTemplates,
    savingTemplate,
    currentTemplateName,
    loadedTemplateName,
    setLoadedTemplateName,
    loadTemplates,
    saveTemplate,
    applyTemplate
  } = usePackingTemplates();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [addItemModal, setAddItemModal] = useState({
    show: false,
    category: ''
  });
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [groupAssignmentMode, setGroupAssignmentMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  const isCoordinated = trip.isCoordinated === true;
  const groups = trip.groups || [];
  const groupOptions = [
    { id: 'all', name: 'All Items' as const },
    { id: 'shared', name: 'Shared Items' as const },
    ...groups.map(g => ({ ...g, name: `${g.name}'s Items` }))
  ];

  useEffect(() => {
    if (trip.tripType && loadedTemplateName === '') {
      console.log(`🎯 [PackingListRefactored] Initial template loading for trip type: ${trip.tripType}`);
      console.log(`🎯 [PackingListRefactored] Current items count: ${items.length}, items with groups: ${items.filter(i => i.assignedGroupId).length}`);
      
      const defaultDescription = getPackingListDescription(trip.tripType);
      setLoadedTemplateName(defaultDescription);
      
      console.log(`🎯 [PackingListRefactored] Set initial template name to: ${defaultDescription}`);
    }
  }, [trip.tripType, setLoadedTemplateName, loadedTemplateName]);

  useEffect(() => {
    const allCategories = new Set(PACKING_CATEGORIES);
    setExpandedCategories(allCategories);
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = PackingListService.filterItemsByGroup(items, selectedGroupId);
    filtered = PackingListService.filterItemsBySearch(filtered, searchTerm);
    return filtered;
  }, [items, selectedGroupId, searchTerm]);

  const groupedItems = useMemo(() => {
    return PackingListService.groupItemsByCategory(filteredItems);
  }, [filteredItems]);

  const progress = useMemo(() => {
    return PackingListService.calculateProgress(filteredItems);
  }, [filteredItems]);

  const handleAddItem = useCallback((category: string) => {
    setAddItemModal({ show: true, category });
  }, []);

  const handleCreateItem = useCallback((
    name: string, 
    category: string, 
    quantity: number, 
    assignedGroupId?: string, 
    isPersonal?: boolean
  ) => {
    console.log(`🆕 [PackingListRefactored] Creating new item "${name}" with group assignment: ${assignedGroupId}`);
    
    const newItem = PackingListService.createNewItem(
      name, 
      category, 
      quantity, 
      assignedGroupId, 
      isPersonal
    );
    
    console.log(`🆕 [PackingListRefactored] Created item:`, newItem);
    
    // Track user-added items separately for debugging
    if (assignedGroupId) {
      const debugInfo = {
        timestamp: Date.now(),
        itemId: newItem.id,
        itemName: newItem.name,
        assignedGroupId: assignedGroupId,
        action: 'user_created_with_group',
        category: newItem.category
      };
      localStorage.setItem('debug_user_added_' + newItem.id, JSON.stringify(debugInfo));
      console.log(`🆕 [PackingListRefactored] Saved debug info for user-added item: ${newItem.name}`);
    }
    
    updateItems([...items, newItem], true);
  }, [items, updateItems]);

  const handleUpdateItem = useCallback((itemId: string, updates: Partial<PackingItem>) => {
    console.log(`🔄 [PackingListRefactored] Updating item ${itemId} with:`, updates);
    
    // Validate group ID if being assigned
    if (updates.assignedGroupId !== undefined) {
      if (updates.assignedGroupId !== null) {
        const groupExists = trip.groups?.some(g => g.id === updates.assignedGroupId);
        if (!groupExists) {
          console.error(`❌ [PackingListRefactored] Invalid group ID: ${updates.assignedGroupId}. Available groups:`, trip.groups?.map(g => `${g.name}(${g.id})`));
          console.error(`❌ [PackingListRefactored] Clearing invalid group assignment to prevent foreign key violation`);
          updates.assignedGroupId = undefined;
        } else {
          console.log(`✅ [PackingListRefactored] Group ID ${updates.assignedGroupId} validated successfully`);
        }
      }
    }
    
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const updatedItem = updatedItems.find(i => i.id === itemId);
    if (updatedItem) {
      console.log(`✅ [PackingListRefactored] Updated item now has assignedGroupId: ${updatedItem.assignedGroupId}`);
    }
    updateItems(updatedItems, true);
  }, [items, updateItems, trip.groups]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    updateItems(updatedItems, true);
  }, [items, updateItems]);

  const handleEditName = useCallback((itemId: string, newName: string) => {
    const sanitized = PackingListService.sanitizeInput(newName);
    handleUpdateItem(itemId, { name: sanitized });
  }, [handleUpdateItem]);

  const handleEditNotes = useCallback((itemId: string, notes: string) => {
    const sanitized = PackingListService.sanitizeInput(notes, 500);
    handleUpdateItem(itemId, { notes: sanitized });
  }, [handleUpdateItem]);

  const handleClearList = useCallback(() => {
    updateItems([], true);
    setShowClearConfirmation(false);
  }, [updateItems]);

  const handleResetList = useCallback(() => {
    if (trip.tripType) {
      console.log(`🔄 [PackingListRefactored] Resetting list to default template`);
      console.log(`🔄 [PackingListRefactored] Current items with group assignments: ${items.filter(i => i.assignedGroupId).length}`);
      
      const groupSize = trip.groups.reduce((sum, g) => sum + g.size, 0) || 1;
      // Calculate trip duration from dates
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 || 3;
      const template = getPackingTemplate(trip.tripType, groupSize, tripDays);
      
      // Create new items but preserve existing group assignments where possible
      const newItems = template.map(item => {
        const existingItem = items.find(existing => existing.name === item.name && existing.category === item.category);
        const newItem = {
          ...PackingListService.createNewItem(item.name, item.category, item.quantity),
          isOwned: item.isOwned || false,
          isPacked: false,
          needsToBuy: item.needsToBuy || false
        };
        
        // Preserve group assignment if it exists
        if (existingItem && existingItem.assignedGroupId) {
          console.log(`🔄 [PackingListRefactored] Preserving group assignment for "${item.name}": ${existingItem.assignedGroupId}`);
          newItem.assignedGroupId = existingItem.assignedGroupId;
        }
        
        return newItem;
      });
      
      console.log(`🔄 [PackingListRefactored] After reset, items with group assignments: ${newItems.filter(i => i.assignedGroupId).length}`);
      updateItems(newItems, true);
    }
  }, [trip, items, updateItems]);

  const handleSaveTemplate = useCallback(async () => {
    if (!templateNameInput.trim() || !trip.tripType) return;
    
    try {
      await saveTemplate(templateNameInput, items, trip.tripType);
      setTemplateNameInput('');
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [templateNameInput, items, trip.tripType, saveTemplate]);

  const handleLoadTemplate = useCallback((template: PackingTemplate) => {
    console.log(`🔄 [PackingListRefactored] Loading template "${template.name}"`);
    console.log(`🔄 [PackingListRefactored] Current items with group assignments: ${items.filter(i => i.assignedGroupId).length}`);
    
    const newItems = applyTemplate(template, trip.id, trip);
    console.log(`🔄 [PackingListRefactored] Template applied, new items with group assignments: ${newItems.filter(i => i.assignedGroupId).length}`);
    
    // ENHANCED PRESERVATION: Use both current items AND localStorage debug keys to preserve assignments
    const preservedItems = newItems.map(newItem => {
      // Try to find existing item by name and category
      const existingItem = items.find(existing => existing.name === newItem.name && existing.category === newItem.category);
      
      if (existingItem && existingItem.assignedGroupId) {
        console.log(`🔄 [PackingListRefactored] Preserving group assignment from existing item "${newItem.name}": ${existingItem.assignedGroupId}`);
        return { ...newItem, assignedGroupId: existingItem.assignedGroupId };
      }
      
      // ENHANCED: Also check for any previous group assignments via debug keys
      // This handles cases where items exist but lost their assignments during template operations
      const groupAssignmentKey = 'debug_group_assignment_' + newItem.id;
      const groupDebug = localStorage.getItem(groupAssignmentKey);
      if (groupDebug) {
        const debugData = JSON.parse(groupDebug);
        if (debugData.newGroupId) {
          console.log(`🔄 [PackingListRefactored] RESTORED group assignment from localStorage for "${newItem.name}": ${debugData.newGroupId} (assigned to ${debugData.groupName})`);
          return { ...newItem, assignedGroupId: debugData.newGroupId };
        }
      }
      
      // Also check legacy user-added debug keys
      const userAddedKey = 'debug_user_added_' + newItem.id;
      const userDebug = localStorage.getItem(userAddedKey);
      if (userDebug) {
        const debugData = JSON.parse(userDebug);
        if (debugData.assignedGroupId) {
          console.log(`🔄 [PackingListRefactored] RESTORED user-added group assignment for "${newItem.name}": ${debugData.assignedGroupId}`);
          return { ...newItem, assignedGroupId: debugData.assignedGroupId };
        }
      }
      
      return newItem;
    });
    
    console.log(`🔄 [PackingListRefactored] After preservation, items with group assignments: ${preservedItems.filter(i => i.assignedGroupId).length}`);
    
    updateItems(preservedItems, true);
    setLoadedTemplateName(template.name);
    setShowTemplateModal(false);
  }, [trip, items, updateItems, applyTemplate, setLoadedTemplateName]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleToggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleAssignSelectedToGroup = useCallback(() => {
    if (selectedItems.size === 0 || !targetGroupId) return;
    
    const updatedItems = items.map(item => {
      if (selectedItems.has(item.id)) {
        return {
          ...item,
          assignedGroupId: targetGroupId === 'none' ? undefined : targetGroupId
        };
      }
      return item;
    });
    
    updateItems(updatedItems, true);
    setSelectedItems(new Set());
    setGroupAssignmentMode(false);
  }, [items, selectedItems, targetGroupId, updateItems]);

  const handleSelectAll = useCallback(() => {
    const allItemIds = filteredItems.map((item: PackingItem) => item.id);
    setSelectedItems(new Set(allItemIds));
  }, [filteredItems]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packing list...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Packing List - ${trip.tripName} | PlanMyEscape`}
        description={`Organize your packing list for ${trip.tripName}. Track items, manage group assignments, and ensure nothing is forgotten.`}
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {itemsError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
            <span>{itemsError}</span>
            <button onClick={clearError} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Packing List for {trip.tripName}
          </h1>
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              {currentTemplateName ? `Current List: ${currentTemplateName}` : `Current List: ${loadedTemplateName}`}
              {loadedTemplateName && currentTemplateName && loadedTemplateName !== currentTemplateName && 
                ` (Loaded: ${loadedTemplateName})`
              }
            </p>
            {selectedGroupId !== 'all' && (
              <p className="text-lg font-medium text-blue-600">
                Viewing: {
                  selectedGroupId === 'shared' 
                    ? 'Shared Items Only' 
                    : `${groups.find(g => g.id === selectedGroupId)?.name}'s Items`
                }
              </p>
            )}
          </div>
        </div>

        <PackingProgress progress={progress} />

        {/* Group Filter Tabs */}
        {groups && groups.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroupId('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGroupId === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedGroupId('shared')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedGroupId === 'shared'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Shared Items
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGroupId === group.id
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={
                  selectedGroupId === group.id
                    ? { backgroundColor: group.color || '#3B82F6' }
                    : {}
                }
              >
                {group.name}'s Items
              </button>
            ))}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isCoordinated && (
            <button
              onClick={() => {
                setGroupAssignmentMode(!groupAssignmentMode);
                setSelectedItems(new Set());
                setTargetGroupId('');
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                groupAssignmentMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Users className="h-5 w-5" />
              {groupAssignmentMode ? 'Exit Group Mode' : 'Assign Groups'}
            </button>
          )}

          {!groupAssignmentMode && (
            <button
              onClick={() => setShowShoppingList(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Shopping List
            </button>
          )}

          {!groupAssignmentMode && (
            <>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Templates
              </button>

              <button
                onClick={handleResetList}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </button>

              <button
                onClick={() => setShowClearConfirmation(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Clear
              </button>
            </>
          )}
        </div>

        {groupAssignmentMode && (
          <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-800">
                  {selectedItems.size} items selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                <span className="text-purple-800 font-medium">Assign to:</span>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="px-3 py-1.5 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a group...</option>
                  <option value="none">No Group (Shared)</option>
                  {trip.groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.size} {group.size === 1 ? 'person' : 'people'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignSelectedToGroup}
                  disabled={selectedItems.size === 0 || !targetGroupId}
                  className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedItems.size > 0 && targetGroupId
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Apply to Selected
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {PACKING_CATEGORIES.map(category => {
            const categoryItems = groupedItems.get(category) || [];
            return (
              <PackingCategory
                key={category}
                category={category}
                items={categoryItems}
                groups={trip.groups}
                isCoordinated={isCoordinated}
                isExpanded={expandedCategories.has(category)}
                onToggleExpand={() => toggleCategory(category)}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onEditName={handleEditName}
                onEditNotes={handleEditNotes}
                groupAssignmentMode={groupAssignmentMode}
                selectedItems={selectedItems}
                onToggleItemSelection={handleToggleItemSelection}
              />
            );
          })}
        </div>

        <AddItemModal
          isOpen={addItemModal.show}
          category={addItemModal.category}
          groups={trip.groups}
          isCoordinated={isCoordinated}
          onClose={() => setAddItemModal({ show: false, category: '' })}
          onAdd={handleCreateItem}
        />

        {showShoppingList && (
          <ShoppingList
            tripId={trip.id}
            groups={trip.groups}
            onClose={() => setShowShoppingList(false)}
          />
        )}

        {showClearConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Clear Packing List?</h2>
              <p className="text-gray-600 mb-6">
                This will remove all items from your packing list. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearList}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear List
                </button>
              </div>
            </div>
          </div>
        )}

        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Packing List Templates</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Save Current List as Template</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Template name..."
                    value={templateNameInput}
                    onChange={(e) => setTemplateNameInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateNameInput.trim() || savingTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Load Template</h3>
                {loadingTemplates ? (
                  <p className="text-gray-600">Loading templates...</p>
                ) : availableTemplates.length === 0 ? (
                  <p className="text-gray-600">No saved templates yet.</p>
                ) : (
                  <div className="space-y-2">
                    {availableTemplates.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-600">
                            {template.items.length} items • {new Date(template.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    loadTemplates();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PackingListRefactored;
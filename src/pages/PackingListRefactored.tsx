import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2, RotateCcw, Save, Download, Upload, ShoppingCart, Search } from 'lucide-react';
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

  const isCoordinated = trip.isCoordinated === true;
  const groupOptions = [{ id: 'all', name: 'All' as const }, ...trip.groups];

  useEffect(() => {
    if (trip.tripType) {
      const defaultDescription = getPackingListDescription(trip.tripType);
      setLoadedTemplateName(defaultDescription);
    }
  }, [trip.tripType, setLoadedTemplateName]);

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
    const newItem = PackingListService.createNewItem(
      name, 
      category, 
      quantity, 
      assignedGroupId, 
      isPersonal
    );
    updateItems([...items, newItem], true);
  }, [items, updateItems]);

  const handleUpdateItem = useCallback((itemId: string, updates: Partial<PackingItem>) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateItems(updatedItems, true);
  }, [items, updateItems]);

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
      const groupSize = trip.groups.reduce((sum, g) => sum + g.size, 0) || 1;
      // Calculate trip duration from dates
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 || 3;
      const template = getPackingTemplate(trip.tripType, groupSize, tripDays);
      const newItems = template.map(item => ({
        ...PackingListService.createNewItem(item.name, item.category, item.quantity),
        isOwned: item.isOwned || false,
        isPacked: false,
        needsToBuy: item.needsToBuy || false
      }));
      updateItems(newItems, true);
    }
  }, [trip, updateItems]);

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
    const newItems = applyTemplate(template, trip.id, trip);
    updateItems(newItems, true);
    setLoadedTemplateName(template.name);
    setShowTemplateModal(false);
  }, [trip, updateItems, applyTemplate, setLoadedTemplateName]);

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
          <p className="text-gray-600 dark:text-gray-400">
            {currentTemplateName ? `Current List: ${currentTemplateName}` : `Current List: ${loadedTemplateName}`}
            {loadedTemplateName && currentTemplateName && loadedTemplateName !== currentTemplateName && 
              ` (Loaded: ${loadedTemplateName})`
            }
          </p>
        </div>

        <PackingProgress progress={progress} />

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
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupOptions.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowShoppingList(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </button>

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
        </div>

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
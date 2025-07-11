import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit3, Save, X, Package, Users, Shield, Sun, Home, Utensils, Scale, Tag } from 'lucide-react';
import { GearItem } from '../types';
import { getGear, saveGear, deleteGear } from '../utils/storage';

// Categories are a fixed list – define once at module level so they don't change every render
const GEAR_CATEGORIES = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Other'] as const;

const GearLocker = () => {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Other', weight: '', notes: '' });

  useEffect(() => {
    const loadData = async () => {
      const gearItems = await getGear();
      setGear(gearItems);
    };
    loadData();
  }, []);

  const addItem = async () => {
    if (newItem.name.trim()) {
      const item: GearItem = {
        id: crypto.randomUUID(),
        name: newItem.name.trim(),
        category: newItem.category,
        weight: newItem.weight ? parseInt(newItem.weight) : undefined,
        notes: newItem.notes.trim() || undefined,
        assignedTrips: []
      };
      const updatedGear = [...gear, item];
      setGear(updatedGear);
      await saveGear(item);
      setNewItem({ name: '', category: 'Other', weight: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const updateItem = async (itemId: string, updates: Partial<GearItem>) => {
    const updatedGear = gear.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setGear(updatedGear);
    const item = updatedGear.find(g => g.id === itemId);
    if (item) await saveGear(item);
    setEditingItem(null);
  };

  const removeItem = async (itemId: string) => {
    const updatedGear = gear.filter(item => item.id !== itemId);
    setGear(updatedGear);
    await deleteGear(itemId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shelter': return <Home className="h-5 w-5" />;
      case 'Kitchen': return <Utensils className="h-5 w-5" />;
      case 'Clothing': return <Users className="h-5 w-5" />;
      case 'Personal': return <Sun className="h-5 w-5" />;
      case 'Tools': return <Shield className="h-5 w-5" />;
      case 'Sleep': return <Home className="h-5 w-5" />;
      case 'Comfort': return <Sun className="h-5 w-5" />;
      case 'Pack': return <Package className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  // Use stable categories constant
  const categories = GEAR_CATEGORIES;

  // Memoised selector – recomputes only when `gear` changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groupedGear = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = gear.filter(item => item.category === category);
      return acc;
    }, {} as Record<string, GearItem[]>);
  }, [gear]);

  const totalItems = gear.length;
  const totalWeight = gear.reduce((sum, item) => sum + (item.weight || 0), 0);
  const assignedItems = gear.filter(item => item.assignedTrips.length > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gear Locker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your camping gear inventory
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-150"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Gear
            </button>
          )}
        </div>
        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Items</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{assignedItems}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Assigned to Trips</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(totalWeight / 1000 * 10) / 10}kg
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Weight</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Gear</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Weight (grams)"
              value={newItem.weight}
              onChange={(e) => setNewItem(prev => ({ ...prev, weight: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItem.notes}
              onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={addItem}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-150"
            >
              <Save className="h-5 w-5 mr-2" />
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-150"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gear List */}
      <div className="space-y-8">
        {categories.map(category => {
          const categoryGear: GearItem[] = groupedGear[category] ?? [];
          if (categoryGear.length === 0) return null;

          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({categoryGear.length})</span>
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryGear.map(item => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingItem === item.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(item.id, { category: e.target.value })}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Weight (g)"
                              value={item.weight || ''}
                              onChange={(e) => updateItem(item.id, { weight: e.target.value ? parseInt(e.target.value) : undefined })}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-x-2">
                              {item.weight && (
                                <span className="inline-flex items-center">
                                  <Scale className="h-4 w-4 mr-1" />
                                  {Math.round(item.weight / 1000 * 10) / 10}kg
                                </span>
                              )}
                              {item.notes && (
                                <span className="inline-flex items-center">
                                  <Tag className="h-4 w-4 mr-1" />
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GearLocker; 
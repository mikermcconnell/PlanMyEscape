import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, Backpack, Package, Users, Shield, Sun, Home, Utensils } from 'lucide-react';
import { GearItem, Trip } from '../types';
import { getGear, saveGear, deleteGear, getTrips } from '../utils/storage';

const GearLocker = () => {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Other', weight: '', notes: '' });

  useEffect(() => {
    setGear(getGear());
    setTrips(getTrips());
  }, []);

  const addItem = () => {
    if (newItem.name.trim()) {
      const item: GearItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: newItem.name.trim(),
        category: newItem.category,
        weight: newItem.weight ? parseInt(newItem.weight) : undefined,
        notes: newItem.notes.trim() || undefined,
        assignedTrips: []
      };
      const updatedGear = [...gear, item];
      setGear(updatedGear);
      saveGear(item);
      setNewItem({ name: '', category: 'Other', weight: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const updateItem = (itemId: string, updates: Partial<GearItem>) => {
    const updatedGear = gear.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setGear(updatedGear);
    const item = updatedGear.find(g => g.id === itemId);
    if (item) saveGear(item);
    setEditingItem(null);
  };

  const removeItem = (itemId: string) => {
    const updatedGear = gear.filter(item => item.id !== itemId);
    setGear(updatedGear);
    deleteGear(itemId);
  };

  const toggleTripAssignment = (itemId: string, tripId: string) => {
    const item = gear.find(g => g.id === itemId);
    if (!item) return;

    const updatedAssignedTrips = item.assignedTrips.includes(tripId)
      ? item.assignedTrips.filter(id => id !== tripId)
      : [...item.assignedTrips, tripId];

    updateItem(itemId, { assignedTrips: updatedAssignedTrips });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shelter': return <Home className="h-4 w-4" />;
      case 'Kitchen': return <Utensils className="h-4 w-4" />;
      case 'Clothing': return <Users className="h-4 w-4" />;
      case 'Personal': return <Sun className="h-4 w-4" />;
      case 'Tools': return <Shield className="h-4 w-4" />;
      case 'Sleep': return <Home className="h-4 w-4" />;
      case 'Comfort': return <Sun className="h-4 w-4" />;
      case 'Pack': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const categories = ['Shelter', 'Kitchen', 'Clothing', 'Personal', 'Tools', 'Sleep', 'Comfort', 'Pack', 'Other'];
  const groupedGear = categories.reduce((acc, category) => {
    acc[category] = gear.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, GearItem[]>);

  const totalItems = gear.length;
  const totalWeight = gear.reduce((sum, item) => sum + (item.weight || 0), 0);
  const assignedItems = gear.filter(item => item.assignedTrips.length > 0).length;

  return (
    <div className="max-w-6xl mx-auto">
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
        </div>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{assignedItems}</div>
            <div className="text-sm text-gray-500">Assigned to Trips</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{Math.round(totalWeight / 1000 * 10) / 10}kg</div>
            <div className="text-sm text-gray-500">Total Weight</div>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Gear</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItem.notes}
              onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={addItem}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save className="h-4 w-4 inline mr-2" />
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Item Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Gear
        </button>
      )}

      {/* Gear List */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryGear = groupedGear[category];
          if (categoryGear.length === 0) return null;

          return (
            <div key={category} className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category}</span>
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryGear.map(item => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingItem === item.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                            />
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(item.id, { category: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
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
                              className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.weight && `${Math.round(item.weight / 1000 * 10) / 10}kg`}
                              {item.notes && ` • ${item.notes}`}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Trip Assignments */}
                    {trips.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assign to trips:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trips.map(trip => (
                            <button
                              key={trip.id}
                              onClick={() => toggleTripAssignment(item.id, trip.id)}
                              className={`px-2 py-1 text-xs rounded-full ${
                                item.assignedTrips.includes(trip.id)
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {trip.tripName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
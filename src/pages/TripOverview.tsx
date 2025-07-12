import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import { Trip, TripType, Group, GROUP_COLORS, GroupColor } from '../types';
import { saveTrip } from '../utils/supabaseTrips';
import WeatherCard from '../components/WeatherCard';
import ActivitiesPlanner from '../components/ActivitiesPlanner';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const TripOverview: React.FC = () => {
  const { trip, setTrip } = useOutletContext<TripContextType>();
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [locationInput, setLocationInput] = useState(trip.location || '');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    size: 1,
    contactName: '',
    contactEmail: '',
    color: GROUP_COLORS[0] as GroupColor
  });

  const updateTripLocation = async () => {
    const updatedTrip = { ...trip, location: locationInput };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
      setShowLocationEdit(false);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const updateTripActivities = async (activities: Trip['activities']) => {
    const updatedTrip = { ...trip, activities };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const addGroup = async () => {
    if (!newGroup.name.trim()) return;
    
    const group: Group = {
      id: crypto.randomUUID(),
      name: newGroup.name.trim(),
      size: newGroup.size,
      contactName: newGroup.contactName.trim() || undefined,
      contactEmail: newGroup.contactEmail.trim() || undefined,
      color: newGroup.color
    };

    const updatedTrip = { ...trip, groups: [...trip.groups, group] };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
      setShowAddGroup(false);
      setNewGroup({
        name: '',
        size: 1,
        contactName: '',
        contactEmail: '',
        color: GROUP_COLORS[0]
      });
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<Group>) => {
    const updatedGroups = trip.groups.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    );
    const updatedTrip = { ...trip, groups: updatedGroups };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
      setEditingGroupId(null);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const removeGroup = async (groupId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to remove this group? This will also remove any items assigned to this group.')) {
      return;
    }
    
    const updatedGroups = trip.groups.filter(group => group.id !== groupId);
    const updatedTrip = { ...trip, groups: updatedGroups };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const getDaysBetweenDates = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

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
        return type;
    }
  };

  const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);

  return (
    <div className="p-6 space-y-8">
      {/* Trip Summary */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              {renderTripTypeText(trip.tripType)} • {totalCampers} {totalCampers === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {/* Trip Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                  {showLocationEdit ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter trip location..."
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={updateTripLocation}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowLocationEdit(false)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.location || 'No location set'}
                      </p>
                      <button
                        onClick={() => setShowLocationEdit(true)}
                        className="text-xs text-green-600 hover:text-green-700 transition-colors"
                      >
                        {trip.location ? 'Edit' : 'Add Location'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {trip.description && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {trip.description}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <WeatherCard 
              startDate={trip.startDate}
              endDate={trip.endDate}
              location={trip.location}
            />
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Groups</h2>
          <button
            onClick={() => setShowAddGroup(true)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Group
          </button>
        </div>

        {trip.groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No groups added yet</p>
            {trip.isCoordinated && (
              <p className="text-sm mt-2">Click "Add Group" to get started</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.groups.map(group => {
              const isEditing = editingGroupId === group.id;
              return (
                <div
                  key={group.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative"
                  style={{ backgroundColor: `${group.color}15` }}
                >
                  {isEditing ? (
                    <GroupEditForm
                      group={group}
                      onSave={(updates) => updateGroup(group.id, updates)}
                      onCancel={() => setEditingGroupId(null)}
                    />
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2" style={{ color: group.color }} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {group.size} {group.size === 1 ? 'person' : 'people'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingGroupId(group.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Edit group"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeGroup(group.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Remove group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {group.contactName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Contact: {group.contactName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Group</h3>
              <button
                onClick={() => setShowAddGroup(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGroup.size}
                  onChange={(e) => setNewGroup({ ...newGroup, size: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Name (optional)
                </label>
                <input
                  type="text"
                  value={newGroup.contactName}
                  onChange={(e) => setNewGroup({ ...newGroup, contactName: e.target.value })}
                  placeholder="Enter contact name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email (optional)
                </label>
                <input
                  type="email"
                  value={newGroup.contactEmail}
                  onChange={(e) => setNewGroup({ ...newGroup, contactEmail: e.target.value })}
                  placeholder="Enter contact email..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {GROUP_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        newGroup.color === color 
                          ? 'border-gray-900 dark:border-white' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddGroup(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGroup}
                disabled={!newGroup.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities Section */}
      <div>
        <ActivitiesPlanner
          activities={trip.activities || []}
          onActivitiesChange={updateTripActivities}
          tripType={trip.tripType}
          tripDays={getDaysBetweenDates(trip.startDate, trip.endDate)}
          tripId={trip.id}
        />
      </div>
    </div>
  );
};

// Group Edit Form Component
interface GroupEditFormProps {
  group: Group;
  onSave: (updates: Partial<Group>) => void;
  onCancel: () => void;
}

const GroupEditForm: React.FC<GroupEditFormProps> = ({ group, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: group.name,
    size: group.size,
    contactName: group.contactName || '',
    contactEmail: group.contactEmail || '',
    color: group.color
  });

  const handleSave = () => {
    onSave({
      name: formData.name.trim(),
      size: formData.size,
      contactName: formData.contactName.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      color: formData.color
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Group Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          People
        </label>
        <input
          type="number"
          min="1"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 1 })}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact Name
        </label>
        <input
          type="text"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact Email
        </label>
        <input
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color
        </label>
        <div className="grid grid-cols-8 gap-1">
          {GROUP_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-6 h-6 rounded-full border transition-colors ${
                formData.color === color 
                  ? 'border-gray-900 dark:border-white' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!formData.name.trim()}
          className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        >
          <Save className="h-3 w-3 mr-1 inline" />
          Save
        </button>
      </div>
    </div>
  );
};

export default TripOverview; 
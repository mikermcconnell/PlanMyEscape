import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, Mail, Search } from 'lucide-react';
import { Trip, TripType, Group, GROUP_COLORS } from '../types';
import { saveTrips, getTrips } from '../utils/storage';
const { v4: uuidv4 } = require('uuid');

const NPS_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key

interface ParkSuggestion {
  fullName: string;
  name: string;
  states: string;
}

const TripSetup = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState<TripType>('car camping');
  const [description, setDescription] = useState('');
  const [isCoordinated, setIsCoordinated] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [parkSuggestions, setParkSuggestions] = useState<ParkSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group>({
    id: '',
    name: '',
    size: 1,
    contactName: '',
    contactEmail: '',
    color: GROUP_COLORS[0]
  });

  useEffect(() => {
    const savedTrips = getTrips();
    setTrips(savedTrips);
  }, []);

  const fetchParkSuggestions = async (query: string) => {
    if (!query.trim()) {
      setParkSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://developer.nps.gov/api/v1/parks?q=${encodeURIComponent(query)}&api_key=${NPS_API_KEY}&limit=5`
      );
      const data = await response.json();
      setParkSuggestions(data.data.map((park: any) => ({
        fullName: park.fullName,
        name: park.name,
        states: park.states
      })));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching park suggestions:', error);
      setParkSuggestions([]);
    }
  };

  const handleTripNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTripName(value);
    fetchParkSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: ParkSuggestion) => {
    setTripName(suggestion.fullName);
    setShowSuggestions(false);
    setParkSuggestions([]);
  };

  const handleAddGroup = () => {
    if (currentGroup.name && currentGroup.size > 0) {
      const newGroup = {
        ...currentGroup,
        id: Date.now().toString(),
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length]
      };
      setGroups([...groups, newGroup]);
      setCurrentGroup({
        id: '',
        name: '',
        size: 1,
        contactName: '',
        contactEmail: '',
        color: GROUP_COLORS[(groups.length + 1) % GROUP_COLORS.length]
      });
      setShowGroupForm(false);
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleCreateTrip = () => {
    const newTrip: Trip = {
      id: uuidv4(),
      tripName,
      tripType,
      startDate,
      endDate,
      description,
      isCoordinated,
      groups: isCoordinated ? groups : []
    };

    // Save trip and navigate
    const updatedTrips = [...trips, newTrip];
    saveTrips(updatedTrips);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Plan Your Trip</h1>

      <div className="space-y-6">
        {/* Basic Trip Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Trip Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={tripName}
                  onChange={handleTripNameChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                  placeholder="Enter a location or custom trip name"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {showSuggestions && parkSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg">
                  {parkSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {suggestion.states}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trip Type</label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value as TripType)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              >
                <option value="car camping">Car Camping</option>
                <option value="canoe camping">Canoe Camping</option>
                <option value="hike camping">Hike Camping</option>
                <option value="cottage">Cottage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                rows={3}
                placeholder="Add any additional details about the trip..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isCoordinated}
                  onChange={(e) => setIsCoordinated(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Coordinate meals and items between groups</span>
              </label>
            </div>
          </div>
        </div>

        {/* Groups Management - Only show when coordination is enabled */}
        {isCoordinated && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Groups/Families</h2>
              <button
                onClick={() => setShowGroupForm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                disabled={showGroupForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </button>
            </div>

            {/* Add Group Form */}
            {showGroupForm && (
              <div className="mb-6 p-4 border rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Group Name</label>
                    <input
                      type="text"
                      value={currentGroup.name}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                      placeholder="Smith Family"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of People</label>
                    <input
                      type="number"
                      min="1"
                      value={currentGroup.size}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, size: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name (Optional)</label>
                    <input
                      type="text"
                      value={currentGroup.contactName || ''}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, contactName: e.target.value || undefined })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email (Optional)</label>
                    <input
                      type="email"
                      value={currentGroup.contactEmail || ''}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, contactEmail: e.target.value || undefined })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowGroupForm(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGroup}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={!currentGroup.name || currentGroup.size < 1}
                  >
                    Add Group
                  </button>
                </div>
              </div>
            )}

            {/* Groups List */}
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                  style={{ borderLeftWidth: '4px', borderLeftColor: group.color }}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <h3 className="font-medium">{group.name}</h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({group.size} {group.size === 1 ? 'person' : 'people'})
                      </span>
                    </div>
                    {(group.contactName || group.contactEmail) && (
                      <div className="mt-1 text-sm text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {group.contactName && <span>{group.contactName}</span>}
                        {group.contactName && group.contactEmail && <span> • </span>}
                        {group.contactEmail && <span>{group.contactEmail}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {groups.length === 0 && !showGroupForm && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Add at least one group to continue
              </p>
            )}
          </div>
        )}

        {/* Create Trip Button */}
        <div className="flex flex-col items-end">
          {isCoordinated && groups.length === 0 && (
            <p className="text-amber-600 dark:text-amber-400 text-sm mb-2">
              <span className="font-medium">Note:</span> When coordination is enabled, at least one group must be added to create the trip.
            </p>
          )}
          <button
            onClick={handleCreateTrip}
            disabled={!tripName || !startDate || !endDate || (isCoordinated && groups.length === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSetup; 
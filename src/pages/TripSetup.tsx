import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, Mail, Search, Info, CheckCircle, AlertCircle, MapPin, Calendar, Users as UsersIcon, Compass, X } from 'lucide-react';
import { Trip, TripType, Group, GROUP_COLORS, TRIP_TYPES } from '../types';
import { saveTrip, getTrips } from '../utils/supabaseTrips';
import { generateId } from '../utils/storage';

interface ParkSuggestion {
  fullName: string;
  name: string;
  states: string;
}

const TripSetup = () => {
  const navigate = useNavigate();
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState<TripType>('car camping');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isCoordinated, setIsCoordinated] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
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
    color: GROUP_COLORS[0] as string
  });
  const [tripNameError, setTripNameError] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Load trips just to prevent duplicate names (future feature)
  const tripsRef = useRef<Trip[]>([]);
  useEffect(() => {
    const loadTrips = async () => {
      const savedTrips = await getTrips();
      tripsRef.current = savedTrips;
    };
    loadTrips();
  }, []);

  // Cleanup-aware suggestion fetcher (debounced ~300ms)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      if (!tripName.trim()) {
        if (isMounted) {
          setParkSuggestions([]);
          setShowSuggestions(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/parks?q=${encodeURIComponent(tripName)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (isMounted) {
          setParkSuggestions(data.data.map((park: any) => ({
            fullName: park.fullName,
            name: park.name,
            states: park.states
          })));
          setShowSuggestions(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching park suggestions:', error);
          setParkSuggestions([]);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [tripName]);

  // Calculate completion progress
  const calculateProgress = () => {
    const steps = [
      tripName.trim() !== '',
      startDate !== '',
      endDate !== '',
      true, // tripType is always set to a valid value by default
      (!isCoordinated && numberOfPeople > 0) || (isCoordinated && groups.length > 0)
    ];
    return Math.round((steps.filter(Boolean).length / steps.length) * 100);
  };

  const progress = calculateProgress();

  // Validate form and update errors
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!tripName.trim()) {
      errors.push('Trip name is required');
    }
    if (!startDate) {
      errors.push('Start date is required');
    }
    if (!endDate) {
      errors.push('End date is required');
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errors.push('End date must be after start date');
    }
    if (isCoordinated && groups.length === 0) {
      errors.push('At least one group is required when coordination is enabled');
    }
    if (!isCoordinated && numberOfPeople < 1) {
      errors.push('Number of people must be at least 1');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Get trip type description and tips
  const getTripTypeInfo = (type: TripType) => {
    const info = {
      'car camping': {
        description: 'Drive-in camping with vehicle access',
        tips: ['Great for families and beginners', 'Can bring more comfort items', 'Access to amenities and facilities']
      },
      'canoe camping': {
        description: 'Water-based camping with canoe/kayak access',
        tips: ['Pack light and waterproof', 'Plan for portaging', 'Consider water safety equipment']
      },
      'hike camping': {
        description: 'Backpacking and wilderness camping',
        tips: ['Ultra-lightweight packing essential', 'Plan for weather changes', 'Navigation skills important']
      },
      'cottage': {
        description: 'Cabin or cottage rental',
        tips: ['Check what amenities are provided', 'Plan for indoor/outdoor activities', 'May need less camping gear']
      }
    };
    return info[type] || info['car camping'];
  };

  const handleTripNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTripName(value);
    setTripNameError('');
  };

  const handleSuggestionClick = (suggestion: ParkSuggestion) => {
    setTripName(suggestion.fullName);
    setShowSuggestions(false);
    setParkSuggestions([]);
  };

  const handleAddGroup = () => {
    if (currentGroup.name && currentGroup.size > 0) {
      const newGroup: Group = {
        ...currentGroup,
        id: Date.now().toString(),
        contactName: currentGroup.contactName?.trim() || undefined,
        contactEmail: currentGroup.contactEmail?.trim() || undefined,
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length] as string
      };
      setGroups([...groups, newGroup]);
      setCurrentGroup({
        id: '',
        name: '',
        size: 1,
        contactName: '',
        contactEmail: '',
        color: GROUP_COLORS[(groups.length + 1) % GROUP_COLORS.length] as string
      });
      setShowGroupForm(false);
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleCreateTrip = async () => {
    if (!validateForm()) {
      return;
    }

    // Create groups based on coordination setting
    let tripGroups: Group[] = [];
    if (isCoordinated) {
      tripGroups = groups;
    } else {
      // Create a default group with the specified number of people
      tripGroups = [{
        id: generateId(),
        name: 'Group',
        size: numberOfPeople,
        contactName: undefined,
        contactEmail: undefined,
        color: GROUP_COLORS[0] as string
      }];
    }

    const newTrip: Trip = {
      id: generateId(),
      tripName,
      tripType,
      startDate,
      endDate,
      description,
      location: location.trim() || undefined,
      isCoordinated,
      groups: tripGroups,
      activities: [],
      emergencyContacts: []
    };

    setCreating(true);
    setCreateError('');
    try {
      await saveTrip(newTrip);
      navigate(`/trip/${newTrip.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  // Calculate number of nights
  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();
  const tripTypeInfo = getTripTypeInfo(tripType);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Welcome Section */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🏕️ Plan Your Perfect Camping Trip
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Let's get you set up with everything you need for an amazing outdoor adventure. 
                We'll help you plan meals, pack efficiently, and coordinate with your group.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Smart packing suggestions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Meal planning made easy</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Group coordination tools</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trip Setup Progress
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {progress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Trip Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">Trip Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Trip Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tripName}
                  onChange={handleTripNameChange}
                  onFocus={() => setShowSuggestions(true)}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 ${
                    tripNameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter a location or custom trip name"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {showSuggestions && parkSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border">
                  {parkSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b last:border-b-0"
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
              {tripNameError && (
                <p className="text-red-600 text-sm mt-1">{tripNameError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Try searching for national parks or campgrounds for automatic suggestions
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location (Optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                placeholder="e.g., Algonquin Park, Muskoka, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                🌤️ Add location for weather forecasts and local information
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Trip Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRIP_TYPES.map((type) => (
                  <label key={type} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="tripType"
                      value={type}
                      checked={tripType === type}
                      onChange={() => setTripType(type)}
                      className="text-green-600"
                    />
                    <span className="text-sm">{type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                  </label>
                ))}
              </div>
              
              {/* Trip Type Info Card */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {tripType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      {tripTypeInfo.description}
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      {tripTypeInfo.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Arrive Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Departure Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Nights notification */}
            {nights > 0 && (
              <div className="md:col-span-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <span className="font-medium">Perfect!</span> Your {nights}-{nights === 1 ? 'night' : 'night'} trip is scheduled
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        We'll help you pack and plan meals for the entire duration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Number of People - Only show when coordination is not selected */}
            {!isCoordinated && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of People <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={numberOfPeople}
                    onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                    placeholder="1"
                  />
                  <UsersIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  👥 This helps us calculate quantities for meals and packing items
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                rows={3}
                placeholder="Add any additional details about the trip, special requirements, or notes..."
              />
              <p className="text-xs text-gray-500 mt-1">
                📝 Helpful for remembering special considerations or group preferences
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isCoordinated}
                  onChange={(e) => setIsCoordinated(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">Coordinate meals and items between groups</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Perfect for multiple families or groups camping together
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Groups Management - Only show when coordination is enabled */}
        {isCoordinated && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">Groups/Families</h2>
              </div>
              <button
                onClick={() => setShowGroupForm(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                disabled={showGroupForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </button>
            </div>

            {/* Coordination Benefits Info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Group Coordination Benefits
                  </h4>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• Assign meals and items to specific groups</li>
                    <li>• Avoid duplicate purchases</li>
                    <li>• Coordinate cooking responsibilities</li>
                    <li>• Track who's bringing what</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Add Group Form */}
            {showGroupForm && (
              <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                <h3 className="font-medium mb-3">Add New Group</h3>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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
                  className="flex items-center justify-between p-4 border rounded-md bg-white dark:bg-gray-700"
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
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total People Summary */}
            {groups.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Total People:
                  </span>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {groups.reduce((sum, group) => sum + group.size, 0)} people
                  </span>
                </div>
              </div>
            )}

            {groups.length === 0 && !showGroupForm && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No groups added yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Add at least one group to continue with coordination
                </p>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Please fix the following issues:
                </h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Create Trip Button */}
        <div className="flex flex-col items-end">
          <button
            onClick={handleCreateTrip}
            disabled={progress < 100}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {progress === 100 ? (
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Create Trip & Continue
              </span>
            ) : (
              <span className="flex items-center">
                <Compass className="h-5 w-5 mr-2" />
                Complete Setup ({progress}%)
              </span>
            )}
          </button>
          {progress < 100 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Complete all required fields to create your trip
            </p>
          )}
        </div>
      </div>

      {/* Loading/Error Message */}
      {creating && <div>Creating trip...</div>}
      {createError && <div style={{color:'red'}}>Error: {createError}</div>}
    </div>
  );
};

export default TripSetup; 
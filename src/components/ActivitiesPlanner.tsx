import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Mountain, Waves, GamepadIcon, X } from 'lucide-react';
import { Activity, TripType, PackingItem } from '../types';
import { getEquipmentSuggestions, detectActivityType } from '../data/activityEquipment';
import { getPackingList, savePackingList } from '../utils/storage';

interface ActivitiesPlannerProps {
  activities: Activity[];
  onActivitiesChange: (activities: Activity[]) => void;
  tripType: TripType;
  tripDays: number;
  tripId: string;
  defaultDay?: number;
}

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' }
];

function getScheduleOptions(tripDays: number) {
  const options = [];
  for (let day = 1; day <= tripDays; day++) {
    for (const slot of TIME_SLOTS) {
      options.push({
        value: JSON.stringify({ day, timeOfDay: slot.key }),
        label: `Day ${day} - ${slot.label}`
      });
    }
  }
  return options;
}

const ActivitiesPlanner: React.FC<ActivitiesPlannerProps> = ({
  activities,
  onActivitiesChange,
  tripType,
  tripDays,
  tripId,
  defaultDay
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    equipment: [] as string[],
    notes: '',
    schedules: defaultDay ? [{ day: defaultDay, timeOfDay: 'morning' }] : [] as { day: number; timeOfDay: string }[]
  });
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [modalEquipment, setModalEquipment] = useState<{ name: string; quantity: number }[]>([]);
  const [modalActivity, setModalActivity] = useState<Omit<Activity, 'id'>>();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Reset activity form when defaultDay changes
  useEffect(() => {
    setNewActivity({
      name: '',
      equipment: [] as string[],
      notes: '',
      schedules: defaultDay ? [{ day: defaultDay, timeOfDay: 'morning' }] : [] as { day: number; timeOfDay: string }[]
    });
  }, [defaultDay]);

  const getActivitySuggestions = (tripType: TripType): Omit<Activity, 'id'>[] => {
    const baseActivities = {
      'cottage': [
        { name: 'Fishing', type: 'water' as const, equipment: ['Fishing rods', 'Tackle box', 'Bait'] },
        { name: 'Swimming', type: 'water' as const, equipment: ['Towels', 'Sunscreen'] },
        { name: 'Kayaking/Canoeing', type: 'water' as const, equipment: ['Paddles', 'Life jackets', 'Boat'] },
        { name: 'Hiking', type: 'outdoor' as const, equipment: ['Hiking boots', 'Water bottles'] },
        { name: 'Nature Walk', type: 'outdoor' as const, equipment: ['Comfortable shoes', 'Water bottle'] },
        { name: 'Yoga', type: 'outdoor' as const, equipment: ['Yoga mat', 'Comfortable clothes'] },
        { name: 'Camp Cooking', type: 'outdoor' as const, equipment: ['Portable stove', 'Cookware', 'Utensils'] },
        { name: 'Campfire Stories', type: 'entertainment' as const, equipment: ['Blanket', 'Flashlight'] },
        { name: 'Stargazing', type: 'outdoor' as const, equipment: ['Blankets', 'Telescope (optional)'] },
        { name: 'Board Games', type: 'indoor' as const, equipment: ['Card games', 'Board games'] },
        { name: 'BBQ/Grilling', type: 'outdoor' as const, equipment: ['Grill', 'Charcoal', 'Lighter'] },
        { name: 'Campfire', type: 'outdoor' as const, equipment: ['Firewood', 'Matches', 'Chairs'] },
        { name: 'Photography', type: 'outdoor' as const, equipment: ['Camera', 'Tripod'] },
        { name: 'Bird Watching', type: 'outdoor' as const, equipment: ['Binoculars', 'Field guide'] },
        { name: 'Water Sports', type: 'water' as const, equipment: ['Water skis', 'Wakeboard', 'Life jackets', 'Boat'] },
        { name: 'Paddleboarding', type: 'water' as const, equipment: ['Paddleboard', 'Paddle', 'Life jacket'] },
        { name: 'Sunset Viewing', type: 'outdoor' as const, equipment: ['Chairs', 'Blankets', 'Camera'] },
        { name: 'Dock Reading', type: 'indoor' as const, equipment: ['Books', 'Comfortable chair', 'Sunscreen'] },
        { name: 'Nature Journaling', type: 'outdoor' as const, equipment: ['Journal', 'Pens', 'Field guide'] },
        { name: 'Rock Painting', type: 'entertainment' as const, equipment: ['Acrylic paints', 'Brushes', 'Rocks'] },
        { name: 'Geocaching', type: 'outdoor' as const, equipment: ['GPS device', 'Small treasures'] },
        { name: 'Pontoon Boat Rides', type: 'water' as const, equipment: ['Pontoon boat', 'Life jackets', 'Snacks'] }
      ],
      'car camping': [
        { name: 'Hiking', type: 'outdoor' as const, equipment: ['Hiking boots', 'Day pack'] },
        { name: 'Nature Photography', type: 'outdoor' as const, equipment: ['Camera', 'Extra batteries'] },
        { name: 'Campfire Cooking', type: 'outdoor' as const, equipment: ['Cast iron', 'Fire tools'] },
        { name: 'Bird Watching', type: 'outdoor' as const, equipment: ['Binoculars', 'Field guide'] },
        { name: 'Yoga', type: 'outdoor' as const, equipment: ['Yoga mat', 'Comfortable clothes'] },
        { name: 'Nature Walk', type: 'outdoor' as const, equipment: ['Comfortable shoes', 'Water bottle'] },
        { name: 'Campfire Stories', type: 'entertainment' as const, equipment: ['Blanket', 'Flashlight'] },
        { name: 'Stargazing', type: 'outdoor' as const, equipment: ['Blankets', 'Telescope (optional)'] },
        { name: 'Board Games', type: 'indoor' as const, equipment: ['Card games', 'Board games'] },
        { name: 'BBQ/Grilling', type: 'outdoor' as const, equipment: ['Grill', 'Charcoal', 'Lighter'] },
        { name: 'Campfire', type: 'outdoor' as const, equipment: ['Firewood', 'Matches', 'Chairs'] },
        { name: 'Fishing', type: 'water' as const, equipment: ['Fishing rods', 'Tackle box', 'Fishing license'] },
        { name: 'Mountain Biking', type: 'outdoor' as const, equipment: ['Mountain bike', 'Helmet', 'Repair kit'] },
        { name: 'Rock Climbing', type: 'outdoor' as const, equipment: ['Climbing gear', 'Helmet', 'Ropes'] },
        { name: 'Geocaching', type: 'outdoor' as const, equipment: ['GPS device', 'Small treasures'] },
        { name: 'Nature Scavenger Hunt', type: 'entertainment' as const, equipment: ['List', 'Bags', 'Magnifying glass'] },
        { name: 'Frisbee/Games', type: 'outdoor' as const, equipment: ['Frisbee', 'Football', 'Soccer ball'] },
        { name: 'Hammock Relaxation', type: 'outdoor' as const, equipment: ['Hammock', 'Books', 'Pillow'] },
        { name: 'Trail Running', type: 'outdoor' as const, equipment: ['Running shoes', 'Water bottle', 'Trail map'] },
        { name: 'Wildlife Tracking', type: 'outdoor' as const, equipment: ['Field guide', 'Measuring tape', 'Camera'] }
      ],
      'canoe camping': [
        { name: 'Paddling', type: 'water' as const, equipment: ['Paddles', 'Life jackets', 'Dry bags', 'Canoe'] },
        { name: 'Portaging', type: 'outdoor' as const, equipment: ['Portage yoke', 'Straps', 'Canoe'] },
        { name: 'Fishing', type: 'water' as const, equipment: ['Compact rod', 'Small tackle box', 'Fishing license'] },
        { name: 'Wildlife Viewing', type: 'outdoor' as const, equipment: ['Binoculars', 'Camera'] },
        { name: 'Yoga', type: 'outdoor' as const, equipment: ['Yoga mat', 'Comfortable clothes'] },
        { name: 'Camp Cooking', type: 'outdoor' as const, equipment: ['Portable stove', 'Cookware', 'Utensils'] },
        { name: 'Campfire Stories', type: 'entertainment' as const, equipment: ['Blanket', 'Flashlight'] },
        { name: 'Stargazing', type: 'outdoor' as const, equipment: ['Blankets', 'Telescope (optional)'] },
        { name: 'Water Sketching', type: 'entertainment' as const, equipment: ['Waterproof sketchbook', 'Pencils', 'Dry bag'] },
        { name: 'Swimming', type: 'water' as const, equipment: ['Towels', 'Quick-dry clothes'] },
        { name: 'Navigation Practice', type: 'outdoor' as const, equipment: ['Map', 'Compass', 'GPS'] },
        { name: 'Camp Crafts', type: 'entertainment' as const, equipment: ['Rope', 'Knife', 'Natural materials'] },
        { name: 'Nature Photography', type: 'outdoor' as const, equipment: ['Waterproof camera', 'Extra batteries'] },
        { name: 'Bird Identification', type: 'outdoor' as const, equipment: ['Field guide', 'Binoculars', 'Journal'] }
      ],
      'hike camping': [
        { name: 'Summit Hiking', type: 'outdoor' as const, equipment: ['Trekking poles', 'Gaiters'] },
        { name: 'Backpacking', type: 'outdoor' as const, equipment: ['Backpack', 'Navigation'] },
        { name: 'Wilderness Skills', type: 'outdoor' as const, equipment: ['Multi-tool', 'Fire starter'] },
        { name: 'Yoga', type: 'outdoor' as const, equipment: ['Yoga mat', 'Comfortable clothes'] },
        { name: 'Camp Cooking', type: 'outdoor' as const, equipment: ['Portable stove', 'Cookware', 'Utensils'] },
        { name: 'Campfire Stories', type: 'entertainment' as const, equipment: ['Blanket', 'Flashlight'] },
        { name: 'Stargazing', type: 'outdoor' as const, equipment: ['Blankets', 'Telescope (optional)'] },
        { name: 'Rock Scrambling', type: 'outdoor' as const, equipment: ['Helmet', 'Gloves', 'Sturdy boots'] },
        { name: 'Alpine Photography', type: 'outdoor' as const, equipment: ['Camera', 'Tripod', 'Extra batteries'] },
        { name: 'Meditation', type: 'outdoor' as const, equipment: ['Cushion', 'Quiet space'] },
        { name: 'Trail Maintenance', type: 'outdoor' as const, equipment: ['Gloves', 'Small tools', 'Trash bags'] },
        { name: 'Orienteering', type: 'outdoor' as const, equipment: ['Map', 'Compass', 'Markers'] },
        { name: 'High Altitude Cooking', type: 'outdoor' as const, equipment: ['Lightweight stove', 'High-altitude fuel'] },
        { name: 'Weather Observation', type: 'outdoor' as const, equipment: ['Barometer', 'Thermometer', 'Journal'] },
        { name: 'Minimal Impact Camping', type: 'outdoor' as const, equipment: ['Trowel', 'Leave No Trace principles'] }
      ]
    };
    return baseActivities[tripType] || [];
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'water': return <Waves className="h-4 w-4" />;
      case 'outdoor': return <Mountain className="h-4 w-4" />;
      case 'indoor': return <GamepadIcon className="h-4 w-4" />;
      case 'entertainment': return <GamepadIcon className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'water': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'outdoor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'indoor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'entertainment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const addActivity = async () => {
    if (!newActivity.name.trim()) return;
    const activityType = detectActivityType(newActivity.name);
    // Get equipment suggestions for the custom activity
    const suggestions = getEquipmentSuggestions(newActivity.name);
    // Merge with any additional equipment entered by the user
    const mergedEquipment = Array.from(new Set([
      ...suggestions.map(s => s.name),
      ...newActivity.equipment.filter(e => e.trim())
    ]));
    setModalActivity({
      name: newActivity.name,
      type: activityType,
      equipment: mergedEquipment,
      notes: newActivity.notes,
      schedules: newActivity.schedules,
    });
    setModalEquipment(mergedEquipment.map(name => ({ name, quantity: 1 })));
    setShowEquipmentModal(true);
    setShowAddForm(false);
    // Reset newActivity after modal confirmation
    setNewActivity({
      name: '',
      equipment: [],
      notes: '',
      schedules: []
    });
  };

  const toggleCompleted = (activityId: string) => {
    const updated = activities.map(activity =>
      activity.id === activityId 
        ? { ...activity, isCompleted: !activity.isCompleted }
        : activity
    );
    onActivitiesChange(updated);
  };

  const deleteActivity = (activityId: string) => {
    onActivitiesChange(activities.filter(a => a.id !== activityId));
  };

  const suggestions = getActivitySuggestions(tripType);
  const suggestedNotAdded = suggestions.filter(
    suggestion => !activities.some(activity => activity.name === suggestion.name)
  );

  const openEquipmentModal = (suggestion: Omit<Activity, 'id'>) => {
    setModalActivity(suggestion);
    setModalEquipment((suggestion.equipment || []).map(name => ({ name, quantity: 1 })));
    setShowEquipmentModal(true);
  };

  const handleEquipmentChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
    setModalEquipment(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addEquipmentRow = () => {
    setModalEquipment(prev => [...prev, { name: '', quantity: 1 }]);
  };

  const removeEquipmentRow = (index: number) => {
    setModalEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const confirmAddToPackingList = async () => {
    if (!modalActivity) return;
    const activity: Activity = {
      ...modalActivity,
      id: crypto.randomUUID(),
      equipment: modalEquipment.filter(e => e.name.trim()).map(e => e.name),
      isCompleted: false,
      schedules: modalActivity.schedules,
    };
    onActivitiesChange([...activities, activity]);
    // Add packing items
    const existingPackingList = await getPackingList(tripId);
    const newPackingItems: PackingItem[] = modalEquipment.filter(e => e.name.trim()).map(e => ({
      id: crypto.randomUUID(),
      name: e.name,
      category: 'Other', // Default, could be improved
      quantity: e.quantity,
      isChecked: false,
      weight: undefined,
      isOwned: false,
      needsToBuy: false,
      isPacked: false,
      required: false,
      assignedGroupId: undefined,
      isPersonal: false
    }));
    // Avoid duplicates
    const filteredItems = newPackingItems.filter(newItem =>
      !existingPackingList.some(existingItem =>
        existingItem.name.toLowerCase() === newItem.name.toLowerCase()
      )
    );
    if (filteredItems.length > 0) {
      await savePackingList(tripId, [...existingPackingList, ...filteredItems]);
    }
    setShowEquipmentModal(false);
    setConfirmation('Added to packing list!');
    setTimeout(() => setConfirmation(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activities & Entertainment
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Activity
          </button>
        </div>
        
      </div>

      {/* Quick Suggestions */}
      {suggestedNotAdded.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Suggested for {tripType === 'cottage' ? 'Cottage' : tripType.charAt(0).toUpperCase() + tripType.slice(1)} Trips
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedNotAdded.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => openEquipmentModal(suggestion)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {getActivityIcon(suggestion.type)}
                <span className="ml-1">{suggestion.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Name
              </label>
              <input
                type="text"
                value={newActivity.name}
                onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Fishing, Hiking, Board Games, Swimming"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                We'll automatically detect the activity type and suggest equipment
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Equipment (optional)
              </label>
              <input
                type="text"
                value={newActivity.equipment.join(', ')}
                onChange={(e) => setNewActivity({...newActivity, equipment: e.target.value.split(',').map(s => s.trim())})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any specific equipment beyond our suggestions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={newActivity.notes}
                onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any specific notes about this activity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule (optional)
              </label>
              <select
                multiple
                value={newActivity.schedules.map(s => JSON.stringify(s))}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => JSON.parse(opt.value));
                  setNewActivity({ ...newActivity, schedules: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                {getScheduleOptions(tripDays).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select one or more days/times for this activity (optional)
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addActivity}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Add Activity
            </button>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowEquipmentModal(false)}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">Edit Equipment for {modalActivity?.name}</h3>
            <div className="space-y-2">
              {modalEquipment.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={item.name}
                    onChange={e => handleEquipmentChange(idx, 'name', e.target.value)}
                    placeholder="Equipment name"
                  />
                  <input
                    className="border rounded px-2 py-1 w-16"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => handleEquipmentChange(idx, 'quantity', Number(e.target.value))}
                  />
                  <button className="text-red-500" onClick={() => removeEquipmentRow(idx)}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button className="text-blue-600 mt-2" onClick={addEquipmentRow}>+ Add Item</button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule (optional)
              </label>
              <select
                multiple
                value={modalActivity?.schedules?.map(s => JSON.stringify(s)) || []}
                onChange={e => {
                  if (!modalActivity) return;
                  const selected = Array.from(e.target.selectedOptions).map(opt => JSON.parse(opt.value));
                  setModalActivity({ ...modalActivity, schedules: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                {getScheduleOptions(tripDays).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={confirmAddToPackingList}
            >
              Add to Packing List
            </button>
          </div>
        </div>
      )}
      {/* Confirmation Message */}
      {confirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {confirmation}
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <GamepadIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No activities planned yet. Add some activities to make your trip more fun!</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`border rounded-lg p-4 transition-colors ${
                activity.isCompleted 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <button
                    onClick={() => toggleCompleted(activity.id)}
                    className="mt-0.5 text-green-600 hover:text-green-700 transition-colors"
                  >
                    {activity.isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className={`font-medium ${activity.isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {activity.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                        <span className="ml-1 capitalize">{activity.type}</span>
                      </span>
                    </div>
                    {activity.equipment && activity.equipment.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>Equipment:</strong> {activity.equipment.join(', ')}
                      </div>
                    )}
                    {activity.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {activity.notes}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteActivity(activity.id)}
                  className="text-red-500 hover:text-red-700 transition-colors ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivitiesPlanner; 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Package,
  Utensils,
  ShoppingCart,
  CheckSquare,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Trip,
  TripType,
  Group,
  GROUP_COLORS,
  GroupColor,
  PackingItem,
  Meal,
  ShoppingItem,
  TodoItem
} from '../types';
import { tripService } from '../services/tripService';
import {
  formatLocalDate,
  getDaysBetweenDates,
  getTripDayDate,
  parseLocalDate
} from '../utils/dateUtils';
import { hybridDataService } from '../services/hybridDataService';

type TripContextType = {
  trip: Trip;
  setTrip: (trip: Trip) => void;
};

interface ModuleMetrics {
  packing: { total: number; packed: number; needsAttention: number };
  meals: { total: number; daysCovered: number };
  shopping: { total: number; checked: number; needsToBuy: number };
  todos: { total: number; completed: number };
}

interface ModuleCard {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: string;
  badge?: string;
  to?: string;
  onClick?: () => void;
}

const defaultModuleMetrics: ModuleMetrics = {
  packing: { total: 0, packed: 0, needsAttention: 0 },
  meals: { total: 0, daysCovered: 0 },
  shopping: { total: 0, checked: 0, needsToBuy: 0 },
  todos: { total: 0, completed: 0 }
};

const TIME_OF_DAY_ORDER: Record<string, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  night: 3
};

const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night'
};

const formatPlural = (value: number, singular: string, plural?: string) => {
  if (value === 1) return `${value} ${singular}`;
  return `${value} ${plural ?? `${singular}s`}`;
};

const TripOverview: React.FC = () => {
  const { trip, setTrip } = useOutletContext<TripContextType>();

  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [locationInput, setLocationInput] = useState(trip.location || '');
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [dateInputs, setDateInputs] = useState({
    startDate: trip.startDate,
    endDate: trip.endDate
  });
  const [dateError, setDateError] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    size: 1,
    contactName: '',
    contactEmail: '',
    color: GROUP_COLORS[0] as GroupColor
  });
  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetrics>(defaultModuleMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsReloadKey, setMetricsReloadKey] = useState(0);
  const [groupPackingCounts, setGroupPackingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setDateInputs({
      startDate: trip.startDate,
      endDate: trip.endDate
    });
  }, [trip.startDate, trip.endDate]);

  useEffect(() => {
    setLocationInput(trip.location || '');
  }, [trip.location]);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const [packingItems, mealsData, shoppingItems, todoItems] = await Promise.all([
          hybridDataService.getPackingItems(trip.id),
          hybridDataService.getMeals(trip.id),
          hybridDataService.getShoppingItems(trip.id),
          hybridDataService.getTodoItems(trip.id)
        ] as [
            Promise<PackingItem[]>,
            Promise<Meal[]>,
            Promise<ShoppingItem[]>,
            Promise<TodoItem[]>
          ]);

        if (!isMounted) {
          return;
        }

        const packingTotal = packingItems.length;
        const packingPacked = packingItems.filter(item => item.isPacked).length;
        const packingRemaining = Math.max(packingTotal - packingPacked, 0);

        const groupCounts = packingItems.reduce((acc, item) => {
          const assignedGroups =
            item.assignedGroupIds && item.assignedGroupIds.length > 0
              ? item.assignedGroupIds
              : item.assignedGroupId
                ? [item.assignedGroupId]
                : [];
          assignedGroups.forEach(groupId => {
            acc[groupId] = (acc[groupId] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        const mealDaysCovered = new Set(mealsData.map(meal => meal.day)).size;

        const shoppingChecked = shoppingItems.filter(item => item.isChecked || item.isOwned).length;
        const shoppingNeeds = shoppingItems.filter(item => item.needsToBuy || (!item.isOwned && !item.isChecked)).length;

        const todosCompleted = todoItems.filter(item => item.isCompleted).length;

        setModuleMetrics({
          packing: {
            total: packingTotal,
            packed: packingPacked,
            needsAttention: packingRemaining
          },
          meals: {
            total: mealsData.length,
            daysCovered: mealDaysCovered
          },
          shopping: {
            total: shoppingItems.length,
            checked: shoppingChecked,
            needsToBuy: shoppingNeeds
          },
          todos: {
            total: todoItems.length,
            completed: todosCompleted
          }
        });
        setGroupPackingCounts(groupCounts);
      } catch (error) {
        console.error('Failed to load trip module metrics', error);
        if (isMounted) {
          setModuleMetrics(defaultModuleMetrics);
          setGroupPackingCounts({});
        }
      } finally {
        if (isMounted) {
          setLoadingMetrics(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      loadMetrics();
    }

    return () => {
      isMounted = false;
    };
  }, [trip.id, trip.groups.length, metricsReloadKey]);

  const updateTripLocation = async () => {
    const normalizedLocation = locationInput.trim();
    const updatedTrip = { ...trip, location: normalizedLocation || undefined };
    setTrip(updatedTrip);
    try {
      await tripService.saveTrip(updatedTrip);
      setShowLocationEdit(false);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const updateTripDates = async () => {
    setDateError(null);

    if (new Date(dateInputs.endDate) < new Date(dateInputs.startDate)) {
      setDateError('End date must be after start date');
      return;
    }

    const updatedTrip = {
      ...trip,
      startDate: dateInputs.startDate,
      endDate: dateInputs.endDate
    };
    setTrip(updatedTrip);
    try {
      await tripService.saveTrip(updatedTrip);
      setShowDateEdit(false);
      setDateError(null);
    } catch (error) {
      console.error('Error saving trip:', error);
      setDateError('Failed to save trip dates. Please try again.');
    }
  };

  const cancelDateEdit = () => {
    setDateInputs({
      startDate: trip.startDate,
      endDate: trip.endDate
    });
    setShowDateEdit(false);
    setDateError(null);
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
      await tripService.saveTrip(updatedTrip);
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
      await tripService.saveTrip(updatedTrip);
      setEditingGroupId(null);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const removeGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to remove this group? This will also remove any items assigned to this group.')) {
      return;
    }

    const updatedGroups = trip.groups.filter(group => group.id !== groupId);
    const updatedTrip = { ...trip, groups: updatedGroups };
    setTrip(updatedTrip);
    try {
      await tripService.saveTrip(updatedTrip);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
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
  const tripDuration = Math.max(getDaysBetweenDates(trip.startDate, trip.endDate), 1);

  const normalizedToday = new Date();
  normalizedToday.setHours(0, 0, 0, 0);
  const normalizedStart = parseLocalDate(trip.startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = parseLocalDate(trip.endDate);
  normalizedEnd.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilStart = Math.max(0, Math.ceil((normalizedStart.getTime() - normalizedToday.getTime()) / msPerDay));
  const tripHasStarted = normalizedToday >= normalizedStart && normalizedToday <= normalizedEnd;
  const tripHasEnded = normalizedToday > normalizedEnd;

  const countdownLabel = tripHasEnded
    ? 'Trip completed'
    : tripHasStarted
      ? 'Trip in progress'
      : `${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'} to go`;

  const readinessSegments = useMemo(() => {
    const segments: number[] = [];
    if (moduleMetrics.packing.total > 0) {
      segments.push(moduleMetrics.packing.packed / moduleMetrics.packing.total);
    }
    if (moduleMetrics.shopping.total > 0) {
      segments.push(moduleMetrics.shopping.checked / moduleMetrics.shopping.total);
    }
    if (moduleMetrics.todos.total > 0) {
      segments.push(moduleMetrics.todos.completed / moduleMetrics.todos.total);
    }
    if (tripDuration > 0) {
      segments.push(Math.min(moduleMetrics.meals.daysCovered / tripDuration, 1));
    }
    return segments;
  }, [moduleMetrics, tripDuration]);

  const readinessScore = readinessSegments.length
    ? Math.round((readinessSegments.reduce((sum, value) => sum + value, 0) / readinessSegments.length) * 100)
    : 0;

  const readinessLabel = readinessScore >= 80
    ? 'Looking good'
    : readinessScore >= 50
      ? 'Making progress'
      : "Let's get planning";

  const totalAssignedItems = useMemo(
    () => Object.values(groupPackingCounts).reduce((sum, count) => sum + count, 0),
    [groupPackingCounts]
  );

  const upcomingActivities = useMemo(() => {
    if (!trip.activities || trip.activities.length === 0) {
      return [] as Array<{
        id: string;
        name: string;
        day: number;
        timeOfDay: string;
        date: Date;
      }>;
    }

    const flattened = trip.activities.flatMap(activity => {
      if (!activity.schedules || activity.schedules.length === 0) {
        return [{
          id: activity.id,
          name: activity.name,
          day: 1,
          timeOfDay: 'morning',
          date: getTripDayDate(trip.startDate, 1)
        }];
      }

      return activity.schedules.map(schedule => ({
        id: `${activity.id}-${schedule.day}-${schedule.timeOfDay}`,
        name: activity.name,
        day: schedule.day,
        timeOfDay: schedule.timeOfDay,
        date: getTripDayDate(trip.startDate, schedule.day)
      }));
    });

    const sorted = flattened.sort((a, b) => {
      if (a.day !== b.day) {
        return a.day - b.day;
      }
      const orderA = TIME_OF_DAY_ORDER[a.timeOfDay] ?? 99;
      const orderB = TIME_OF_DAY_ORDER[b.timeOfDay] ?? 99;
      return orderA - orderB;
    });

    return sorted.slice(0, 3);
  }, [trip.activities, trip.startDate]);

  const activitiesCount = trip.activities?.length ?? 0;

  const handleRefreshMetrics = useCallback(() => {
    setMetricsReloadKey(prev => prev + 1);
  }, []);

  const handleScrollToGroups = useCallback(() => {
    if (typeof window === 'undefined') return;
    const section = document.getElementById('groups-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const moduleCards = useMemo<ModuleCard[]>(() => {
    const statusText = (value: string) => (loadingMetrics ? 'Checking status...' : value);
    const remainingPacking = Math.max(moduleMetrics.packing.total - moduleMetrics.packing.packed, 0);
    const remainingTodos = Math.max(moduleMetrics.todos.total - moduleMetrics.todos.completed, 0);
    const remainingShopping = Math.max(moduleMetrics.shopping.total - moduleMetrics.shopping.checked, 0);
    const mealCoverageLabel = moduleMetrics.meals.total
      ? moduleMetrics.meals.daysCovered >= tripDuration
        ? 'All days covered'
        : `Covers ${Math.min(moduleMetrics.meals.daysCovered, tripDuration)}/${tripDuration} days`
      : undefined;
    const nextActivity = upcomingActivities[0];
    const nextActivityLabel = nextActivity
      ? `Next: Day ${nextActivity.day} - ${TIME_OF_DAY_LABELS[nextActivity.timeOfDay] ?? nextActivity.timeOfDay}`
      : undefined;

    return [
      {
        id: 'packing',
        label: 'Packing List',
        description: 'Organize and assign gear',
        icon: Package,
        to: `/trip/${trip.id}/packing`,
        status: statusText(
          moduleMetrics.packing.total
            ? `${moduleMetrics.packing.packed}/${moduleMetrics.packing.total} packed`
            : 'No items yet'
        ),
        badge:
          loadingMetrics || moduleMetrics.packing.total === 0
            ? undefined
            : remainingPacking > 0
              ? `${remainingPacking} to pack`
              : 'All packed'
      },
      {
        id: 'meals',
        label: 'Meal Planning',
        description: 'Plan menus and servings',
        icon: Utensils,
        to: `/trip/${trip.id}/meals`,
        status: statusText(
          moduleMetrics.meals.total
            ? `${moduleMetrics.meals.total} meals planned`
            : 'Start your meal plan'
        ),
        badge: !loadingMetrics ? mealCoverageLabel : undefined
      },
      {
        id: 'shopping',
        label: 'Shopping List',
        description: 'Track what to buy',
        icon: ShoppingCart,
        to: `/trip/${trip.id}/shopping`,
        status: statusText(
          moduleMetrics.shopping.total
            ? `${moduleMetrics.shopping.checked}/${moduleMetrics.shopping.total} purchased`
            : 'Build your shopping list'
        ),
        badge:
          loadingMetrics || moduleMetrics.shopping.total === 0
            ? undefined
            : remainingShopping > 0
              ? `${remainingShopping} to buy`
              : 'All stocked'
      },
      {
        id: 'schedule',
        label: 'Schedule',
        description: 'Keep your itinerary tight',
        icon: Calendar,
        to: `/trip/${trip.id}/schedule`,
        status: statusText(
          activitiesCount > 0
            ? `${activitiesCount} activities planned`
            : 'Draft your itinerary'
        ),
        badge: !loadingMetrics ? nextActivityLabel : undefined
      },
      {
        id: 'todos',
        label: 'To-do List',
        description: 'Assign prep tasks',
        icon: CheckSquare,
        to: `/trip/${trip.id}/todos`,
        status: statusText(
          moduleMetrics.todos.total
            ? `${moduleMetrics.todos.completed}/${moduleMetrics.todos.total} done`
            : 'Add preparation tasks'
        ),
        badge:
          loadingMetrics || moduleMetrics.todos.total === 0
            ? undefined
            : remainingTodos > 0
              ? `${remainingTodos} remaining`
              : 'All tasks complete'
      },
      {
        id: 'groups',
        label: 'Groups',
        description: 'Coordinate campers & contacts',
        icon: Users,
        onClick: handleScrollToGroups,
        status: statusText(
          trip.groups.length
            ? `${trip.groups.length} ${trip.groups.length === 1 ? 'group' : 'groups'}`
            : 'Create your first group'
        ),
        badge:
          loadingMetrics
            ? undefined
            : trip.groups.length
              ? `${totalCampers} campers | ${totalAssignedItems} items`
              : 'Add teammates'
      },
      {
        id: 'notes',
        label: 'Trip Notes',
        description: 'Capture logistics & reminders',
        icon: FileText,
        to: `/notes?tripId=${encodeURIComponent(trip.id)}`,
        status: 'Keep everyone aligned',
        badge: 'Shared workspace'
      }
    ];
  }, [
    activitiesCount,
    handleScrollToGroups,
    loadingMetrics,
    moduleMetrics,
    totalAssignedItems,
    totalCampers,
    trip.groups.length,
    trip.id,
    tripDuration,
    upcomingActivities
  ]);

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Trip Overview
            </span>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{trip.tripName}</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {renderTripTypeText(trip.tripType)} • {formatPlural(totalCampers, 'camper')}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:text-right">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
              {countdownLabel}
            </div>
            <div className="text-sm sm:text-base text-gray-600 sm:text-right">
              <div className="font-medium text-gray-900">{formatLocalDate(trip.startDate)} to {formatLocalDate(trip.endDate)}</div>
              <div>{formatPlural(tripDuration, 'day')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-700">Trip window</p>
                <p className="text-sm font-semibold text-gray-900 sm:text-base">{formatPlural(tripDuration, 'day')}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-700">Location</p>
                <p className="text-sm font-semibold text-gray-900 sm:text-base">
                  {trip.location ? trip.location : 'Set your destination'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                <CheckSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-700">Readiness</p>
                <p className="text-sm font-semibold text-gray-900 sm:text-base">{readinessScore}% ready</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowDateEdit(true)}
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Calendar className="mr-2 h-4 w-4" /> Adjust dates
          </button>
          <button
            type="button"
            onClick={() => {
              setLocationInput(trip.location || '');
              setShowLocationEdit(true);
            }}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
          >
            <MapPin className="mr-2 h-4 w-4" /> {trip.location ? 'Update location' : 'Add location'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddGroup(true)}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Invite group
          </button>
        </div>
      </section>


      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plan modules</h2>
            <p className="text-sm text-gray-500">Jump into the planning tools you need next</p>
          </div>
          <button
            type="button"
            onClick={handleRefreshMetrics}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            {loadingMetrics ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Loader2 className="h-4 w-4 text-gray-400" />
            )}
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map(card => {
            const Icon = card.icon;
            const content = (
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{card.label}</p>
                        <p className="text-xs text-gray-500">{card.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover/card:text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{card.status}</p>
                </div>
                {card.badge && (
                  <span className="mt-4 inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    {card.badge}
                  </span>
                )}
              </div>
            );

            const baseClass =
              'group/card flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

            return card.to ? (
              <Link key={card.id} to={card.to} className={baseClass}>
                {content}
              </Link>
            ) : (
              <button
                key={card.id}
                type="button"
                onClick={card.onClick}
                className={baseClass}
              >
                {content}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming activities</h2>
              <p className="text-sm text-gray-500">Highlighting the next things on your schedule</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {formatPlural(activitiesCount, 'activity')}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {upcomingActivities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No activities scheduled yet. Head to the schedule to start planning your days.
              </div>
            ) : (
              upcomingActivities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
                    <p className="text-xs text-gray-500">
                      Day {activity.day} - {TIME_OF_DAY_LABELS[activity.timeOfDay] ?? activity.timeOfDay}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                    {activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to={`/trip/${trip.id}/schedule`}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              Open full schedule
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Coordination tips</h2>
              <p className="text-sm text-gray-500">Quick reminders to keep everyone in sync</p>
            </div>
          </div>
          <ul className="mt-6 space-y-4 text-sm text-gray-600">
            <li className="flex gap-3 rounded-2xl bg-gray-50 p-4">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Share the schedule with campers so everyone knows the plan for each day.
            </li>
            <li className="flex gap-3 rounded-2xl bg-gray-50 p-4">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Double-check meal coverage against your group size to avoid last-minute grocery runs.
            </li>
            <li className="flex gap-3 rounded-2xl bg-gray-50 p-4">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              Use the to-do list to assign prep like car pools, permits, and equipment checks.
            </li>
          </ul>
        </div>
      </section>

      <section id="groups-section" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
            <p className="text-sm text-gray-500">Assign responsibilities and capture key contacts</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddGroup(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add group
          </button>
        </div>

        {trip.groups.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Coordinate your camp crew</h3>
            <p className="mt-2 text-sm text-gray-600">
              Groups help you assign packing items, share meal duties, and keep everyone accountable.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddGroup(true)}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
              >
                Create first group
              </button>
              <Link
                to={`/trip/${trip.id}/packing`}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                Plan gear assignments
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trip.groups.map(group => {
              const isEditing = editingGroupId === group.id;
              const assignedItems = groupPackingCounts[group.id] || 0;

              return (
                <div key={group.id} className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <span
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: group.color }}
                  />
                  {isEditing ? (
                    <GroupEditForm
                      group={group}
                      onSave={(updates) => updateGroup(group.id, updates)}
                      onCancel={() => setEditingGroupId(null)}
                    />
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                            <p className="text-base font-semibold text-gray-900">{group.name}</p>
                          </div>
                          <p className="text-sm text-gray-500">{formatPlural(group.size, 'person')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingGroupId(group.id)}
                            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            title="Edit group"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(group.id)}
                            className="rounded-full p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Remove group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {(group.contactName || group.contactEmail) && (
                        <div className="rounded-2xl bg-gray-50 p-3 text-xs text-gray-600">
                          {group.contactName && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">Primary contact</span>
                              <span>{group.contactName}</span>
                            </div>
                          )}
                          {group.contactEmail && (
                            <div className="mt-1 truncate text-gray-500">{group.contactEmail}</div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Packing items</p>
                          <p className="mt-1 font-semibold text-gray-900">{assignedItems}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Color code</p>
                          <p className="mt-1 font-semibold text-gray-900">{group.color}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showDateEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Adjust trip dates</h3>
              <button
                type="button"
                onClick={cancelDateEdit}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Start date
                <input
                  type="date"
                  value={dateInputs.startDate}
                  onChange={(e) => setDateInputs({ ...dateInputs, startDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                End date
                <input
                  type="date"
                  value={dateInputs.endDate}
                  onChange={(e) => setDateInputs({ ...dateInputs, endDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              {dateError && (
                <p className="text-sm text-red-600">{dateError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDateEdit}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateTripDates}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
              >
                Save dates
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Set trip location</h3>
              <button
                type="button"
                onClick={() => {
                  setLocationInput(trip.location || '');
                  setShowLocationEdit(false);
                }}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Destination
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Algonquin Provincial Park"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocationInput(trip.location || '');
                  setShowLocationEdit(false);
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateTripLocation}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
              >
                Save location
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add new group</h3>
              <button
                type="button"
                onClick={() => setShowAddGroup(false)}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Group name *
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Riverside Campers"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Number of people
                <input
                  type="number"
                  min="1"
                  value={newGroup.size}
                  onChange={(e) => setNewGroup({ ...newGroup, size: Math.max(parseInt(e.target.value, 10) || 1, 1) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact name (optional)
                  <input
                    type="text"
                    value={newGroup.contactName}
                    onChange={(e) => setNewGroup({ ...newGroup, contactName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Contact email (optional)
                  <input
                    type="email"
                    value={newGroup.contactEmail}
                    onChange={(e) => setNewGroup({ ...newGroup, contactEmail: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Color</p>
                <div className="mt-2 grid grid-cols-8 gap-2">
                  {GROUP_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, color })}
                      className={`h-8 w-8 rounded-full border-2 transition ${newGroup.color === color ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddGroup(false)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addGroup}
                disabled={!newGroup.name.trim()}
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    <div className="space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Group name
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </label>

      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        People
        <input
          type="number"
          min="1"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: Math.max(parseInt(e.target.value, 10) || 1, 1) })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </label>

      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Contact name
        <input
          type="text"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </label>

      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Contact email
        <input
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Color</p>
        <div className="mt-2 grid grid-cols-8 gap-2">
          {GROUP_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`h-8 w-8 rounded-full border-2 transition ${formData.color === color ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!formData.name.trim()}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-3 w-3" /> Save
        </button>
      </div>
    </div>
  );
};

export default TripOverview;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Plus, Trash2, Edit3, X, CheckSquare } from 'lucide-react';
import { TodoItem, Trip } from '../types';
import { hybridDataService } from '../services/hybridDataService';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const TodoList = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [items, setItems] = useState<TodoItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [newItemText, setNewItemText] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Ref to keep track of the current timeout across renders
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(
    (tripId: string, items: TodoItem[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        hybridDataService.saveTodoItems(tripId, items).catch(error => {
          console.error('Failed to save todo items:', error);
          setUpdateError('Failed to save todo items. Please try again.');
        });
      }, 300);
    },
    []
  );

  // Function to update items state and trigger save
  const updateItems = useCallback(
    (newItems: TodoItem[]) => {
      setItems(newItems);
      debouncedSave(tripId, newItems);
    },
    [tripId, debouncedSave]
  );

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load todo items
  useEffect(() => {
    const loadTodoItems = async () => {
      try {
        const todoItems = await hybridDataService.getTodoItems(tripId);
        setItems(todoItems);
      } catch (error) {
        console.error('Failed to load todo items:', error);
        setUpdateError('Failed to load todo items. Please refresh the page.');
      }
    };

    loadTodoItems();
  }, [tripId]);

  // Sort items: incomplete first (by display order), then completed (by display order)
  const sortedItems = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1; // Completed items go to bottom
    }
    return a.displayOrder - b.displayOrder;
  });

  const generateId = (): string => {
    return crypto.randomUUID ? crypto.randomUUID() : 
      Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addTodoItem = () => {
    if (!newItemText.trim()) return;

    const now = new Date().toISOString();
    const maxOrder = Math.max(0, ...items.filter(item => !item.isCompleted).map(item => item.displayOrder));
    
    const newItem: TodoItem = {
      id: generateId(),
      text: newItemText.trim(),
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      displayOrder: maxOrder + 1
    };

    const updatedItems = [...items, newItem];
    updateItems(updatedItems);
    setNewItemText('');
    setShowAddForm(false);
  };

  const toggleTodoItem = (itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updated = {
          ...item,
          isCompleted: !item.isCompleted,
          updatedAt: new Date().toISOString()
        };
        
        // If marking as completed, move to bottom by setting high display order
        if (updated.isCompleted) {
          const maxCompletedOrder = Math.max(0, ...items.filter(i => i.isCompleted).map(i => i.displayOrder));
          updated.displayOrder = maxCompletedOrder + 1;
        } else {
          // If marking as incomplete, move to appropriate position among incomplete items
          const maxIncompleteOrder = Math.max(0, ...items.filter(i => !i.isCompleted).map(i => i.displayOrder));
          updated.displayOrder = maxIncompleteOrder + 1;
        }
        
        return updated;
      }
      return item;
    });
    
    updateItems(updatedItems);
  };

  const deleteTodoItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    updateItems(updatedItems);
  };

  const startEditingItem = (item: TodoItem) => {
    setEditingItem(item.id);
    setEditingText(item.text);
  };

  const saveEditingItem = () => {
    if (!editingItem || !editingText.trim()) {
      cancelEditingItem();
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === editingItem) {
        return {
          ...item,
          text: editingText.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    updateItems(updatedItems);
    setEditingItem(null);
    setEditingText('');
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditingText('');
  };

  const clearCompletedItems = () => {
    const updatedItems = items.filter(item => !item.isCompleted);
    updateItems(updatedItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const completedCount = items.filter(item => item.isCompleted).length;
  const totalCount = items.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Todo List</h1>
          </div>
          {completedCount > 0 && (
            <button
              onClick={clearCompletedItems}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Completed ({completedCount})</span>
            </button>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Track your trip tasks and reminders</span>
            <span>{totalCount - completedCount} of {totalCount} remaining</span>
          </div>
          {totalCount > 0 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {updateError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{updateError}</p>
          <button
            onClick={() => setUpdateError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add new item form */}
      <div className="mb-6">
        {showAddForm ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addTodoItem)}
                placeholder="Enter a new todo item..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={addTodoItem}
                disabled={!newItemText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add new todo item</span>
          </button>
        )}
      </div>

      {/* Todo items list */}
      <div className="space-y-2">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No todo items yet</p>
            <p className="text-sm">Add your first todo item to get started!</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all ${
                item.isCompleted ? 'opacity-60' : ''
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodoItem(item.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {item.isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : null}
              </button>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                {editingItem === item.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, saveEditingItem)}
                    onBlur={saveEditingItem}
                    className="w-full px-2 py-1 text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-gray-900 ${
                      item.isCompleted ? 'line-through' : ''
                    }`}
                  >
                    {item.text}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingItem === item.id ? (
                  <>
                    <button
                      onClick={saveEditingItem}
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditingItem}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditingItem(item)}
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit item"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTodoItem(item.id)}
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            {completedCount === totalCount && totalCount > 0
              ? "Great job! All tasks completed! 🎉"
              : `${totalCount - completedCount} task${totalCount - completedCount !== 1 ? 's' : ''} remaining`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TodoList;
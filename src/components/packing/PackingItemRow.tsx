import React from 'react';
import { Check, Trash2, Edit3, X, CheckCircle, StickyNote } from 'lucide-react';
import { PackingItem, Trip } from '../../types';

interface PackingItemRowProps {
  item: PackingItem;
  trip: Trip;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
  editingNotes: string | null;
  notesText: string;
  setNotesText: (text: string) => void;
  toggleOwned: (id: string) => void;
  togglePacked: (id: string) => void;
  updateItem: (id: string, updates: Partial<PackingItem>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  startEditingNotes: (id: string, notes?: string) => void;
  saveNotes: (id: string) => void;
  cancelEditingNotes: () => void;
  toggleGroupAssignment: (id: string, groupId: string | null) => void;
}

export const PackingItemRow: React.FC<PackingItemRowProps> = ({
  item,
  trip,
  editingItem,
  setEditingItem,
  editingNotes,
  notesText,
  setNotesText,
  toggleOwned,
  togglePacked,
  updateItem,
  updateItemQuantity,
  deleteItem,
  startEditingNotes,
  saveNotes,
  cancelEditingNotes,
  toggleGroupAssignment
}) => {
  return (
    <div className="px-3 sm:px-6 py-4">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3">
          {/* Top row: Status buttons and item name */}
          <div className="flex items-center space-x-2">
            {/* Status Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => toggleOwned(item.id)}
                className={`p-1 rounded-full transition-colors ${item.isOwned
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                title={item.isOwned ? "I have this item" : "Mark as 'I have it'"}
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => togglePacked(item.id)}
                className={`p-1 rounded-full transition-colors ${item.isPacked
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                title={item.isPacked ? "Item is packed" : "Mark as packed"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>

            {/* Item name and details */}
            {editingItem === item.id ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                  className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 text-sm"
                />
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingItem(item.id)}
                className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-2 rounded flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`${item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                      } text-sm break-words`}>
                      {item.name}
                    </span>
                  </div>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-500 bg-transparent ml-2">×{item.quantity}</span>
                  )}
                  {item.weight && (
                    <span className="text-xs text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                  )}
                </div>
              </div>
            )}

            {/* Edit, Notes, and Delete buttons */}
            {editingItem !== item.id && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setEditingItem(item.id)}
                  className="text-gray-400 hover:text-blue-600 p-1"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingNotes(item.id, item.notes);
                  }}
                  className={`p-1 ${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                >
                  <StickyNote className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                  }}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notes editing section */}
          {editingNotes === item.id && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add notes about this item..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => saveNotes(item.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditingNotes}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Display existing notes */}
          {item.notes && editingNotes !== item.id && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
              </div>
            </div>
          )}

          {/* Bottom row: Group assignment and status badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Group Assignment */}
              {trip.isCoordinated && (
                <div className="flex items-center space-x-2 text-xs">
                  {/* Shared checkbox */}
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        !item.assignedGroupIds ||
                        item.assignedGroupIds.length === 0 ||
                        (item.assignedGroupIds.length === trip.groups.length &&
                          trip.groups.every(g => item.assignedGroupIds?.includes(g.id)))
                      }
                      onChange={() => toggleGroupAssignment(item.id, null)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-600 dark:text-gray-400">Shared</span>
                  </label>
                  {/* Group checkboxes */}
                  {trip.groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center space-x-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.assignedGroupIds?.includes(group.id) || false}
                        onChange={() => toggleGroupAssignment(item.id, group.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                        style={{ accentColor: group.color }}
                      />
                      <span style={{ color: group.color }}>{group.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex items-center space-x-1">
              {item.isOwned && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Owned
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Status Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleOwned(item.id)}
                className={`p-1 rounded-full transition-colors ${item.isOwned
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                title={item.isOwned ? "I have this item" : "Mark as 'I have it'"}
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => togglePacked(item.id)}
                className={`p-1 rounded-full transition-colors ${item.isPacked
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                title={item.isPacked ? "Item is packed" : "Mark as packed"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
            {/* Item Details */}
            {editingItem === item.id ? (
              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 flex-1 min-w-0"
                  style={{ width: `${Math.max(item.name.length * 8 + 32, 120)}px` }}
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700"
                />
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 flex-1 max-w-xl">
                <div
                  onClick={() => setEditingItem(item.id)}
                  className="flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded flex items-center"
                >
                  <span className={`${item.isPacked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                    } break-words max-w-[300px]`}>
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-sm text-gray-500 bg-transparent ml-2">×{item.quantity}</span>
                  )}
                  {item.weight && (
                    <span className="text-sm text-gray-500 ml-2">({Math.round(item.weight / 1000 * 10) / 10}kg)</span>
                  )}
                </div>
                {/* Group Assignment */}
                {trip.isCoordinated && (
                  <div className="flex items-center space-x-2 text-sm ml-2">
                    {/* Shared checkbox */}
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          !item.assignedGroupIds ||
                          item.assignedGroupIds.length === 0 ||
                          (item.assignedGroupIds.length === trip.groups.length &&
                            trip.groups.every(g => item.assignedGroupIds?.includes(g.id)))
                        }
                        onChange={() => toggleGroupAssignment(item.id, null)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-600 dark:text-gray-400">Shared</span>
                    </label>
                    {/* Group checkboxes */}
                    {trip.groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center space-x-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.assignedGroupIds?.includes(group.id) || false}
                          onChange={() => toggleGroupAssignment(item.id, group.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                          style={{ accentColor: group.color }}
                        />
                        <span style={{ color: group.color }}>{group.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingItem(item.id)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingNotes(item.id, item.notes);
                    }}
                    className={`${item.notes ? 'text-blue-500 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                  >
                    <StickyNote className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* Status Badge */}
                {item.isOwned && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Owned
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes editing section for desktop */}
        {editingNotes === item.id && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Notes</span>
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes about this item..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none dark:bg-gray-800 dark:text-white"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => saveNotes(item.id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEditingNotes}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Display existing notes for desktop */}
        {item.notes && editingNotes !== item.id && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-blue-800 dark:text-blue-200">{item.notes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
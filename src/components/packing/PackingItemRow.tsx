import React, { useState } from 'react';
import { Check, Trash2, Edit3, X, ShoppingCart, CheckCircle, StickyNote } from 'lucide-react';
import { PackingItem, Group } from '../../types';
import { PackingListService } from '../../services/packingListService';

interface PackingItemRowProps {
  item: PackingItem;
  groups: Group[];
  isCoordinated: boolean;
  onUpdate: (itemId: string, updates: Partial<PackingItem>) => void;
  onDelete: (itemId: string) => void;
  onEditName: (itemId: string, newName: string) => void;
  onEditNotes: (itemId: string, notes: string) => void;
}

export const PackingItemRow: React.FC<PackingItemRowProps> = ({
  item,
  groups,
  isCoordinated,
  onUpdate,
  onDelete,
  onEditName,
  onEditNotes
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedNotes, setEditedNotes] = useState(item.notes || '');
  const [editedQuantity, setEditedQuantity] = useState(item.quantity.toString());

  const handleSaveName = () => {
    const validation = PackingListService.validateItemName(editedName);
    if (validation.isValid) {
      onEditName(item.id, editedName);
      setIsEditingName(false);
    }
  };

  const handleSaveNotes = () => {
    const validation = PackingListService.validateNotes(editedNotes);
    if (validation.isValid) {
      onEditNotes(item.id, editedNotes);
      setIsEditingNotes(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      onUpdate(item.id, { quantity });
    }
  };

  const getGroupColor = (groupId?: string) => {
    if (!groupId || !isCoordinated) return '';
    const group = groups.find(g => g.id === groupId);
    return group?.color || '#808080';
  };

  const statusClass = PackingListService.getItemStatusClass(item);
  const groupColor = getGroupColor(item.assignedGroupId);

  return (
    <div className={`p-3 sm:p-4 rounded-lg ${statusClass} transition-all`}
         style={groupColor ? { borderLeftWidth: '4px', borderLeftColor: groupColor } : {}}>
      
      {/* Mobile Layout - Stacked */}
      <div className="sm:hidden space-y-2">
        {/* First Row - Status icons and item name */}
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Status icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onUpdate(item.id, { needsToBuy: !item.needsToBuy })}
              className={`p-1.5 rounded transition-colors ${
                item.needsToBuy ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.needsToBuy ? 'Need to buy' : 'Mark as need to buy'}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>

            <button
              onClick={() => onUpdate(item.id, { isOwned: !item.isOwned })}
              className={`p-1.5 rounded transition-colors ${
                item.isOwned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.isOwned ? 'Owned' : 'Mark as owned'}
            >
              <Check className="h-4 w-4" />
            </button>

            <button
              onClick={() => onUpdate(item.id, { isPacked: !item.isPacked })}
              className={`p-1.5 rounded transition-colors ${
                item.isPacked ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.isPacked ? 'Packed' : 'Mark as packed'}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Item name */}
          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-1.5 py-0.5 border rounded text-sm min-w-0"
                style={{ fontSize: '0.875rem', height: '28px', maxWidth: 'calc(100% - 60px)' }}
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-600 p-1 flex-shrink-0">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="text-red-600 p-1 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="font-medium text-gray-800 text-sm truncate">
                {item.name}
              </span>
              <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
                <Edit3 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Second Row - Quantity and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Qty:</label>
            <input
              type="number"
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(e.target.value)}
              onBlur={(e) => handleQuantityChange(e.target.value)}
              className="w-14 px-2 py-1 border rounded text-center text-sm"
              min="1"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className={`p-1.5 rounded transition-colors ${
                item.notes ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
              title="Notes"
            >
              <StickyNote className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Third Row - Group assignment (if groups exist) */}
        {groups && groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="radio"
                name={`group-${item.id}`}
                value="shared"
                checked={!item.assignedGroupId}
                onClick={() => onUpdate(item.id, { assignedGroupId: undefined })}
                onChange={() => {}} 
                className="h-3 w-3 cursor-pointer"
              />
              <span>Shared</span>
            </label>
            {groups.map(group => (
              <label key={group.id} className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`group-${item.id}`}
                  value={group.id}
                  checked={item.assignedGroupId === group.id}
                  onClick={() => onUpdate(item.id, { assignedGroupId: group.id })}
                  onChange={() => {}}
                  className="h-3 w-3 cursor-pointer"
                />
                <span>{group.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Layout - Single Row */}
      <div className="hidden sm:flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Status icons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onUpdate(item.id, { needsToBuy: !item.needsToBuy })}
              className={`p-1.5 rounded transition-colors ${
                item.needsToBuy ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.needsToBuy ? 'Need to buy' : 'Mark as need to buy'}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>

            <button
              onClick={() => onUpdate(item.id, { isOwned: !item.isOwned })}
              className={`p-1.5 rounded transition-colors ${
                item.isOwned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.isOwned ? 'Owned' : 'Mark as owned'}
            >
              <Check className="h-4 w-4" />
            </button>

            <button
              onClick={() => onUpdate(item.id, { isPacked: !item.isPacked })}
              className={`p-1.5 rounded transition-colors ${
                item.isPacked ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-600'
              }`}
              title={item.isPacked ? 'Packed' : 'Mark as packed'}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>

          {isEditingName ? (
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-1.5 py-0.5 border rounded flex-1 min-w-0 text-sm"
                style={{ fontSize: '0.875rem', height: '28px' }}
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-600 flex-shrink-0 p-1">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="text-red-600 flex-shrink-0 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <span className="font-medium text-gray-800">
                {item.name}
              </span>
              <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
                <Edit3 className="h-3 w-3" />
              </button>
            </div>
          )}

          <input
            type="number"
            value={editedQuantity}
            onChange={(e) => setEditedQuantity(e.target.value)}
            onBlur={(e) => handleQuantityChange(e.target.value)}
            className="w-16 px-2 py-1 border rounded text-center flex-shrink-0"
            min="1"
          />
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className={`p-2 rounded transition-colors ${
              item.notes ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
            title="Notes"
          >
            <StickyNote className="h-4 w-4" />
          </button>

          {groups && groups.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`group-${item.id}`}
                  value="shared"
                  checked={!item.assignedGroupId}
                  onClick={() => onUpdate(item.id, { assignedGroupId: undefined })}
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Shared</span>
              </label>
              {groups.map(group => (
                <label key={group.id} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`group-${item.id}`}
                    value={group.id}
                    checked={item.assignedGroupId === group.id}
                    onClick={() => onUpdate(item.id, { assignedGroupId: group.id })}
                    onChange={() => {}}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    style={group.color ? { accentColor: group.color } : {}}
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditingNotes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border">
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Add notes about this item..."
            className="w-full px-3 py-2 text-sm border rounded resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingNotes(false)}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {item.notes && !isEditingNotes && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-blue-800">{item.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
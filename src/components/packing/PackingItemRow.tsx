import React, { useState } from 'react';
import { Check, Trash2, Edit3, X, Package, ShoppingCart, CheckCircle, StickyNote } from 'lucide-react';
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
    <div className={`p-4 rounded-lg ${statusClass} transition-all`}
         style={groupColor ? { borderLeftWidth: '4px', borderLeftColor: groupColor } : {}}>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            checked={item.isChecked}
            onChange={(e) => onUpdate(item.id, { isChecked: e.target.checked })}
            className="h-5 w-5 text-blue-600"
          />

          {isEditingName ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-2 py-1 border rounded flex-1"
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-600">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 flex-1">
              <span className={`font-medium ${item.isChecked ? 'line-through text-gray-500' : ''}`}>
                {item.name}
              </span>
              <button onClick={() => setIsEditingName(true)} className="text-gray-600 hover:text-gray-800">
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            type="number"
            value={editedQuantity}
            onChange={(e) => setEditedQuantity(e.target.value)}
            onBlur={(e) => handleQuantityChange(e.target.value)}
            className="w-16 px-2 py-1 border rounded text-center"
            min="1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdate(item.id, { isOwned: !item.isOwned })}
            className={`p-2 rounded transition-colors ${
              item.isOwned ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
            title={item.isOwned ? 'Owned' : 'Mark as owned'}
          >
            <Package className="h-4 w-4" />
          </button>

          <button
            onClick={() => onUpdate(item.id, { needsToBuy: !item.needsToBuy })}
            className={`p-2 rounded transition-colors ${
              item.needsToBuy ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
            title={item.needsToBuy ? 'Need to buy' : 'Mark as need to buy'}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>

          <button
            onClick={() => onUpdate(item.id, { isPacked: !item.isPacked })}
            className={`p-2 rounded transition-colors ${
              item.isPacked ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
            title={item.isPacked ? 'Packed' : 'Mark as packed'}
          >
            <CheckCircle className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className={`p-2 rounded transition-colors ${
              item.notes ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
            title="Notes"
          >
            <StickyNote className="h-4 w-4" />
          </button>

          {isCoordinated && (
            <select
              value={item.assignedGroupId || ''}
              onChange={(e) => onUpdate(item.id, { assignedGroupId: e.target.value || undefined })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Shared</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
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
import React from 'react';
import { Plus } from 'lucide-react';
import { PackingItem, Trip } from '../../types';
import { PackingItemRow } from './PackingItemRow';

interface PackingCategoryGroupProps {
    category: string;
    items: PackingItem[];
    icon: React.ReactNode;
    onAddItem: () => void;
    // Props for PackingItemRow
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

export const PackingCategoryGroup: React.FC<PackingCategoryGroupProps> = ({
    category,
    items,
    icon,
    onAddItem,
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
    // Group items by subcategory
    const { subcategoryGroups, generalItems } = React.useMemo(() => {
        const groups: Record<string, PackingItem[]> = {};
        const general: PackingItem[] = [];

        items.forEach(item => {
            if (item.subcategory) {
                if (!groups[item.subcategory]) {
                    groups[item.subcategory] = [];
                }
                groups[item.subcategory]!.push(item);
            } else {
                general.push(item);
            }
        });

        return { subcategoryGroups: groups, generalItems: general };
    }, [items]);

    if (items.length === 0 && category !== 'Activities') return null;

    const renderItems = (itemList: PackingItem[]) => (
        itemList.map((item) => (
            <PackingItemRow
                key={item.id}
                item={item}
                trip={trip}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                editingNotes={editingNotes}
                notesText={notesText}
                setNotesText={setNotesText}
                toggleOwned={toggleOwned}
                togglePacked={togglePacked}
                updateItem={updateItem}
                updateItemQuantity={updateItemQuantity}
                deleteItem={deleteItem}
                startEditingNotes={startEditingNotes}
                saveNotes={saveNotes}
                cancelEditingNotes={cancelEditingNotes}
                toggleGroupAssignment={toggleGroupAssignment}
            />
        ))
    );

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg pt-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-black flex items-center ${category === 'Kitchen' ? 'text-blue-600' : 'text-gray-800'} dark:text-white`}>
                        {icon}
                        <span className="ml-2">{category}</span>
                    </h3>
                    <button
                        onClick={onAddItem}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="px-6 py-4 text-sm italic text-gray-500 dark:text-gray-300">
                    {category === 'Activities'
                        ? 'Activities added from the overview or schedule will appear here.'
                        : 'No items yet.'}
                </div>
            ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Render General Items first */}
                    {generalItems.length > 0 && renderItems(generalItems)}

                    {/* Render Subcategories */}
                    {Object.entries(subcategoryGroups).map(([subcategory, subItems]) => (
                        <div key={subcategory}>
                            <div className="px-6 py-2 bg-gray-50 dark:bg-gray-750 text-sm font-bold text-gray-500 uppercase tracking-wider border-t border-b border-gray-100 dark:border-gray-700">
                                {subcategory}
                            </div>
                            {renderItems(subItems)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

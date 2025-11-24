
import React from 'react';
import { Check, X } from 'lucide-react';
import { PackingItem } from '../../types';

interface PackedCategoryGroupProps {
    category: string;
    items: PackingItem[];
    icon: React.ReactNode;
    togglePacked: (id: string) => void;
}

export const PackedCategoryGroup: React.FC<PackedCategoryGroupProps> = ({
    category,
    items,
    icon,
    togglePacked
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

    if (items.length === 0) return null;

    const renderItems = (itemList: PackingItem[]) => (
        itemList.map((item) => (
            <div key={item.id} className="px-3 sm:px-6 py-3 opacity-75">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600 dark:text-gray-400 line-through">
                            {item.name}
                        </span>
                        {item.quantity > 1 && (
                            <span className="text-xs text-gray-500 bg-transparent">×{item.quantity}</span>
                        )}
                    </div>
                    <button
                        onClick={() => togglePacked(item.id)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Unpack this item"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        ))
    );

    return (
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center">
                        {icon}
                        <span className="ml-2">{category}</span>
                    </h4>
                </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {/* Render General Items first */}
                {generalItems.length > 0 && renderItems(generalItems)}

                {/* Render Subcategories */}
                {Object.entries(subcategoryGroups).map(([subcategory, subItems]) => (
                    <div key={subcategory}>
                        <div className="px-6 py-2 bg-gray-100 dark:bg-gray-650 text-xs font-bold text-gray-500 uppercase tracking-wider border-t border-b border-gray-200 dark:border-gray-600">
                            {subcategory}
                        </div>
                        {renderItems(subItems)}
                    </div>
                ))}
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShoppingCart, FileDown, Check } from 'lucide-react';
import { Trip, ShoppingItem } from '../types';
import { getShoppingList, saveShoppingList } from '../utils/storage';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const ShoppingListPage: React.FC = () => {
  const { trip } = useOutletContext<TripContextType>();
  const tripId = trip.id;
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const list = await getShoppingList(tripId);
      setAllItems(list);
    };
    load();
  }, [tripId]);

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Shopping List', 14, 20);

    doc.setFontSize(12);
    let y = 30;
    const needToBuy = allItems.filter(i => i.needsToBuy);

    needToBuy.forEach(item => {
      const line = `${item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}`;
      doc.rect(14, y - 4, 6, 6); // empty checkbox
      doc.text(line, 22, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('shopping-list.pdf');
  };

  const toggleBought = async (itemId: string) => {
    const updated = allItems.map(it => it.id === itemId ? { ...it, isChecked: !it.isChecked } : it);
    setAllItems(updated);
    await saveShoppingList(tripId, updated);

    const toggled = updated.find(i => i.id === itemId);
    if (toggled?.isChecked) {
      toast.success(`Great! You bought ${toggled.name}.`, { autoClose: 2000 });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Combined Shopping List
        </h2>
        <button
          onClick={exportPDF}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      {(() => {
        const needToBuy = allItems.filter(i => i.needsToBuy);
        const total = needToBuy.length;
        const bought = needToBuy.filter(i => i.isChecked).length;
        const remaining = total - bought;
        return (
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6 max-w-md">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{bought}/{total}</div>
              <div className="text-sm text-gray-500">Bought</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{remaining}</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        );
      })()}

      {allItems.filter(i => i.needsToBuy).length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No items marked as need to buy.</div>
      ) : (
        <div className="space-y-2 max-w-md">
          {allItems.filter(i => i.needsToBuy).map(item => (
            <div key={item.id} className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleBought(item.id)}
                className={`p-1 rounded-full transition-colors mr-3 ${
                  item.isChecked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
                title={item.isChecked ? 'Bought' : 'Mark as bought'}
              >
                <Check className="h-4 w-4" />
              </button>
              <span className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'} flex-1`}>
                {item.name}{item.quantity > 1 && <span className="ml-1 text-sm text-gray-500">×{item.quantity}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ShoppingListPage; 
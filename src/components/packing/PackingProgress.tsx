import React from 'react';
import { Package, ShoppingCart, CheckCircle } from 'lucide-react';
import { PackingProgress as PackingProgressType } from '../../services/packingListService';

interface PackingProgressProps {
  progress: PackingProgressType;
}

export const PackingProgress: React.FC<PackingProgressProps> = ({ progress }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Packing Progress
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Owned</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">
              {progress.ownedItems}/{progress.totalItems}
            </p>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress.ownedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Packed</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">
              {progress.packedItems}/{progress.totalItems}
            </p>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${progress.packedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <ShoppingCart className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">To Buy</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">
              {progress.needToBuyItems}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
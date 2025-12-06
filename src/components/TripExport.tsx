/**
 * TripExport Component
 * Provides export options for a specific trip (PDF, ICS calendar)
 */

import React, { useState } from 'react';
import { Download, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Trip, PackingItem, Meal, ShoppingItem } from '../types';
import { exportTripToPDF, exportTripToICS } from '../services/exportService';
import { hybridDataService } from '../services/hybridDataService';

interface TripExportProps {
    trip: Trip;
}

const TripExport: React.FC<TripExportProps> = ({ trip }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Load trip data for comprehensive export
            const [packingItems, meals, shoppingItems] = await Promise.all([
                hybridDataService.getPackingItems(trip.id),
                hybridDataService.getMeals(trip.id),
                hybridDataService.getShoppingItems(trip.id)
            ]);

            exportTripToPDF(trip, packingItems, meals, shoppingItems);
        } catch (error) {
            console.error('Failed to export PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportICS = async () => {
        setIsExporting(true);
        try {
            exportTripToICS(trip, trip.activities);
        } catch (error) {
            console.error('Failed to export ICS:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isExporting}
            >
                <Download className="h-4 w-4" />
                Export
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isExpanded && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4 text-red-500" />
                            <div className="text-left">
                                <div className="font-medium">PDF Summary</div>
                                <div className="text-xs text-gray-500">Full trip details</div>
                            </div>
                        </button>
                        <button
                            onClick={handleExportICS}
                            disabled={isExporting}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <div className="text-left">
                                <div className="font-medium">Calendar (ICS)</div>
                                <div className="text-xs text-gray-500">Add to your calendar</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripExport;

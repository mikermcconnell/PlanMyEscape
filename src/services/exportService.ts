/**
 * Export Service
 * Provides PDF and ICS calendar export functionality for trips
 */

import jsPDF from 'jspdf';
import { Trip, PackingItem, Meal, ShoppingItem, Activity } from '../types';
import logger from '../utils/logger';

/**
 * Generate ICS calendar format string
 */
function generateICS(events: Array<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;
}>): string {
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string): string => {
        return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };

    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PlanMyEscape//Trip Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    events.forEach((event, index) => {
        ics.push(
            'BEGIN:VEVENT',
            `UID:planmyescape-${Date.now()}-${index}@planmyescape.ca`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(event.startDate)}`,
            `DTEND:${formatDate(event.endDate)}`,
            `SUMMARY:${escapeText(event.title)}`,
            `DESCRIPTION:${escapeText(event.description)}`
        );

        if (event.location) {
            ics.push(`LOCATION:${escapeText(event.location)}`);
        }

        ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
}

/**
 * Export trip to ICS calendar file
 */
export function exportTripToICS(
    trip: Trip,
    activities?: Activity[]
): void {
    const events: Array<{
        title: string;
        description: string;
        startDate: Date;
        endDate: Date;
        location?: string;
    }> = [];

    // Main trip event
    const tripStart = new Date(trip.startDate);
    tripStart.setHours(12, 0, 0, 0);

    const tripEnd = new Date(trip.endDate);
    tripEnd.setHours(12, 0, 0, 0);

    events.push({
        title: trip.tripName,
        description: `${trip.tripType} trip with ${trip.groups.reduce((sum, g) => sum + g.size, 0)} people`,
        startDate: tripStart,
        endDate: tripEnd,
        location: trip.location
    });

    // Add scheduled activities
    if (activities) {
        activities.forEach(activity => {
            if (activity.schedules && activity.schedules.length > 0) {
                activity.schedules.forEach(schedule => {
                    const activityDate = new Date(trip.startDate);
                    activityDate.setDate(activityDate.getDate() + schedule.day - 1);

                    // Set time based on timeOfDay
                    const timeMap: Record<string, number> = {
                        morning: 9,
                        afternoon: 14,
                        evening: 18
                    };
                    activityDate.setHours(timeMap[schedule.timeOfDay] || 12, 0, 0, 0);

                    const endTime = new Date(activityDate);
                    endTime.setHours(endTime.getHours() + 2);

                    events.push({
                        title: `${trip.tripName}: ${activity.name}`,
                        description: activity.equipment?.join(', ') || '',
                        startDate: activityDate,
                        endDate: endTime,
                        location: trip.location
                    });
                });
            }
        });
    }

    const icsContent = generateICS(events);
    downloadFile(icsContent, `${trip.tripName.replace(/\s+/g, '-')}.ics`, 'text/calendar');

    logger.log(`[ExportService] Exported trip "${trip.tripName}" to ICS with ${events.length} events`);
}

/**
 * Export complete trip summary to PDF
 */
export function exportTripToPDF(
    trip: Trip,
    packingItems?: PackingItem[],
    meals?: Meal[],
    shoppingItems?: ShoppingItem[]
): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const addPageIfNeeded = (requiredSpace: number = 30) => {
        if (y + requiredSpace > 280) {
            doc.addPage();
            y = 20;
        }
    };

    // Header
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(trip.tripName, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${trip.tripType.charAt(0).toUpperCase() + trip.tripType.slice(1)}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.text(
        `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`,
        pageWidth / 2, y, { align: 'center' }
    );
    y += 15;

    // Groups section
    if (trip.groups.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Groups', 14, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(80);
        trip.groups.forEach(group => {
            doc.text(`• ${group.name} (${group.size} ${group.size === 1 ? 'person' : 'people'})`, 18, y);
            y += 6;
        });
        y += 10;
    }

    // Packing List section
    if (packingItems && packingItems.length > 0) {
        addPageIfNeeded(40);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Packing List', 14, y);
        y += 8;

        const packed = packingItems.filter(i => i.isPacked).length;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`${packed}/${packingItems.length} items packed`, 14, y);
        y += 8;

        // Group by category
        const categories = [...new Set(packingItems.map(i => i.category))];
        categories.forEach(category => {
            addPageIfNeeded(20);
            doc.setFontSize(11);
            doc.setTextColor(60);
            doc.text(category, 14, y);
            y += 6;

            doc.setFontSize(9);
            doc.setTextColor(100);
            packingItems
                .filter(i => i.category === category)
                .forEach(item => {
                    addPageIfNeeded();
                    const status = item.isPacked ? '☑' : '☐';
                    const owned = item.isOwned ? '' : ' (need to buy)';
                    doc.text(`  ${status} ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}${owned}`, 18, y);
                    y += 5;
                });
            y += 4;
        });
        y += 10;
    }

    // Meals section
    if (meals && meals.length > 0) {
        addPageIfNeeded(40);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Meal Plan', 14, y);
        y += 10;

        const mealsByDay = meals.reduce((acc, meal) => {
            if (!acc[meal.day]) acc[meal.day] = [];
            acc[meal.day]!.push(meal);
            return acc;
        }, {} as Record<number, Meal[]>);

        Object.keys(mealsByDay).sort((a, b) => Number(a) - Number(b)).forEach(day => {
            addPageIfNeeded(20);
            doc.setFontSize(11);
            doc.setTextColor(60);
            doc.text(`Day ${day}`, 14, y);
            y += 6;

            doc.setFontSize(9);
            const dayMeals = mealsByDay[Number(day)];
            if (dayMeals) {
                dayMeals.forEach(meal => {
                    doc.setTextColor(80);
                    doc.text(`  ${meal.type}: ${meal.name}`, 18, y);
                    y += 5;
                });
            }
            y += 4;
        });
        y += 10;
    }

    // Shopping List section
    if (shoppingItems && shoppingItems.length > 0) {
        const toBuy = shoppingItems.filter(i => i.needsToBuy && !i.isChecked);
        if (toBuy.length > 0) {
            addPageIfNeeded(40);
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Shopping List', 14, y);
            y += 8;

            doc.setFontSize(9);
            doc.setTextColor(100);
            toBuy.forEach(item => {
                addPageIfNeeded();
                doc.text(`☐ ${item.name}${item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}`, 18, y);
                y += 5;
            });
        }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated by PlanMyEscape on ${new Date().toLocaleDateString()}`, pageWidth / 2, 290, { align: 'center' });

    doc.save(`${trip.tripName.replace(/\s+/g, '-')}-summary.pdf`);

    logger.log(`[ExportService] Exported trip "${trip.tripName}" to PDF`);
}

/**
 * Helper to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

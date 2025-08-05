/**
 * Date utility functions for consistent date handling across the application
 * Prevents timezone issues when parsing date strings
 */

/**
 * Parses a date string (YYYY-MM-DD) as a local date to avoid timezone issues
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the local date
 */
export const parseLocalDate = (dateString: string): Date => {
  const dateParts = dateString.split('-');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD format.`);
  }
  
  const year = parseInt(dateParts[0]!, 10);
  const month = parseInt(dateParts[1]!, 10);
  const dayPart = parseInt(dateParts[2]!, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(dayPart)) {
    throw new Error(`Invalid date values in: ${dateString}`);
  }
  
  // Create local date (month is 0-indexed in JavaScript Date constructor)
  return new Date(year, month - 1, dayPart);
};

/**
 * Formats a date string for display, avoiding timezone issues
 * @param dateString - Date string in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export const formatLocalDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  try {
    const localDate = parseLocalDate(dateString);
    return localDate.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Gets the date for a specific day of a trip, avoiding timezone issues
 * @param startDateString - Trip start date in YYYY-MM-DD format
 * @param dayNumber - Day number (1-based)
 * @returns Date object for the specified day
 */
export const getTripDayDate = (startDateString: string, dayNumber: number): Date => {
  const startDate = parseLocalDate(startDateString);
  const dayDate = new Date(startDate);
  dayDate.setDate(startDate.getDate() + dayNumber - 1);
  return dayDate;
};

/**
 * Calculates the number of days between two date strings (inclusive)
 * @param startDateString - Start date in YYYY-MM-DD format
 * @param endDateString - End date in YYYY-MM-DD format
 * @returns Number of days between dates (inclusive)
 */
export const getDaysBetweenDates = (startDateString: string, endDateString: string): number => {
  try {
    const startDate = parseLocalDate(startDateString);
    const endDate = parseLocalDate(endDateString);
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 1;
  }
};
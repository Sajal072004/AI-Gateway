import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Get current day in YYYY-MM-DD format (Asia/Kolkata timezone)
 */
export function getCurrentDay() {
    return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get current month in YYYY-MM format (Asia/Kolkata timezone)
 */
export function getCurrentMonth() {
    return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM');
}

/**
 * Get day from a specific date in YYYY-MM-DD format (Asia/Kolkata timezone)
 */
export function getDayFromDate(date) {
    return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get month from a specific date in YYYY-MM format (Asia/Kolkata timezone)
 */
export function getMonthFromDate(date) {
    return formatInTimeZone(date, TIMEZONE, 'yyyy-MM');
}

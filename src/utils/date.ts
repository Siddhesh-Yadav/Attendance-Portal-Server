/**
 * Calculate the number of working days (Mon-Fri) between two dates inclusive.
 */
export function calculateLeaveDays(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      // Skip weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Get the current calendar year.
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate hours between two timestamps.
 */
export function calculateHours(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

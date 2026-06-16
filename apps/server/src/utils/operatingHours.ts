/**
 * Checks if a restaurant is currently open based on its operating hours.
 * 
 * @param operatingHours - Record of day names to open/close/closed settings.
 * @param isOpenManualOverride - The manual isOpen toggle status from the database.
 * @returns boolean
 */
export function isRestaurantOpen(
  operatingHours: any,
  isOpenManualOverride = true
): boolean {
  if (!isOpenManualOverride) return false;
  if (!operatingHours) return true; // Default to open if not configured

  // Get current local time
  const now = new Date();
  
  // Format day name in English lowercase (matching database seeds)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = now.getDay();
  const currentDay = days[currentDayIndex];
  
  // Current time in minutes since midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Check if we are within today's operating hours
  const hoursToday = operatingHours[currentDay];
  if (hoursToday && !hoursToday.closed && hoursToday.open && hoursToday.close) {
    const [openHour, openMin] = hoursToday.open.split(':').map(Number);
    const [closeHour, closeMin] = hoursToday.close.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (closeMinutes > openMinutes) {
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return true;
      }
    } else {
      // Overnight closing (e.g. opens at 11:00 AM today and closes at 01:30 AM tomorrow)
      // We are open if we are after the opening time today (until midnight)
      if (currentMinutes >= openMinutes) {
        return true;
      }
    }
  }

  // 2. Check if we are within yesterday's overnight hours (e.g., yesterday opened and closes early morning today)
  const yesterdayIndex = (currentDayIndex - 1 + 7) % 7;
  const yesterdayDay = days[yesterdayIndex];
  const hoursYesterday = operatingHours[yesterdayDay];
  if (hoursYesterday && !hoursYesterday.closed && hoursYesterday.open && hoursYesterday.close) {
    const [openHour, openMin] = hoursYesterday.open.split(':').map(Number);
    const [closeHour, closeMin] = hoursYesterday.close.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (closeMinutes < openMinutes) {
      // Yesterday closed past midnight (meaning early morning today)
      // We are open if current time is before yesterday's closing time today
      if (currentMinutes < closeMinutes) {
        return true;
      }
    }
  }

  return false;
}

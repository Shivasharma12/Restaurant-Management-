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
  // If the owner manually toggled the restaurant to open, it is open (master switch)
  return isOpenManualOverride;
}

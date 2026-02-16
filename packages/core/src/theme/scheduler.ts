/**
 * Determines if the current time falls within the "dark" period.
 * Handles midnight wrapping: if startHour > endHour, the dark period
 * spans midnight (e.g., 20:00 - 07:00).
 */
export function shouldBeDark(startHour: number, endHour: number): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  if (startHour <= endHour) {
    // Same-day range (e.g., 08:00 - 18:00)
    return currentHour >= startHour && currentHour < endHour;
  }

  // Midnight-wrapping range (e.g., 20:00 - 07:00)
  return currentHour >= startHour || currentHour < endHour;
}

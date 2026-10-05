/** -300 becomes "300 BCE", 1889 becomes "1889". */
export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year)
}

import { parseWeekIdentifier } from './week-identifier.utils';

/**
 * Generates a ticket number in the format TK-{YEAR}W{WEEK}-{SEQUENTIAL_4_DIGITS}.
 * Example: TK-2026W16-0001
 *
 * @param weekIdentifier - e.g. "2026-W16"
 * @param sequential     - integer starting from 1
 */
export function generateTicketNumber(
  weekIdentifier: string,
  sequential: number,
): string {
  const { year, week } = parseWeekIdentifier(weekIdentifier);
  const seq = sequential.toString().padStart(4, '0');
  return `TK-${year}W${week.toString().padStart(2, '0')}-${seq}`;
}

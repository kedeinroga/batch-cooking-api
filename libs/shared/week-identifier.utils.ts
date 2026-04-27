import { nowInLima } from './lima-time.utils';

/**
 * Returns the ISO week number for a given date.
 * ISO 8601: week starts on Monday, week 1 = week containing first Thursday of the year.
 */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // 1=Mon … 7=Sun
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * Returns the ISO week year (may differ from calendar year near year boundaries).
 */
export function getIsoWeekYear(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  return d.getUTCFullYear();
}

/**
 * Formats a date as "YYYY-WNN" (e.g. "2026-W16").
 */
export function toWeekIdentifier(date: Date): string {
  const week = getIsoWeekNumber(date).toString().padStart(2, '0');
  const year = getIsoWeekYear(date);
  return `${year}-W${week}`;
}

/**
 * Returns the current week identifier based on Lima time.
 */
export function currentWeekIdentifier(): string {
  return toWeekIdentifier(nowInLima());
}

/**
 * Parses "YYYY-WNN" into { year, week }.
 * Throws if the format is invalid.
 */
export function parseWeekIdentifier(weekIdentifier: string): {
  year: number;
  week: number;
} {
  const match = weekIdentifier.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new Error(
      `Invalid week identifier format: "${weekIdentifier}". Expected YYYY-WNN`,
    );
  }
  return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) };
}

/**
 * Returns true if the ordering window is currently open.
 * Window closes on Friday at 12:00 PM Lima time (UTC-5).
 * After Friday 12:00 PM, and on weekends, the window is closed.
 */
export function isOrderWindowOpen(now?: Date): boolean {
  const limaDate = now ? now : nowInLima();

  const dayOfWeek = limaDate.getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat
  const hour = limaDate.getHours();
  const minutes = limaDate.getMinutes();

  // Saturday or Sunday → closed
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Friday after 12:00 PM → closed
  if (dayOfWeek === 5 && (hour > 12 || (hour === 12 && minutes >= 0)))
    return false;

  return true;
}

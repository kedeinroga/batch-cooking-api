const LIMA_TIMEZONE = 'America/Lima';

export function utcToLima(date: Date): Date {
  const limaString = date.toLocaleString('en-US', { timeZone: LIMA_TIMEZONE });
  return new Date(limaString);
}

export function nowInLima(): Date {
  return utcToLima(new Date());
}

export function limaToUtc(limaDate: Date): Date {
  // Lima is UTC-5 (no DST)
  return new Date(limaDate.getTime() + 5 * 60 * 60 * 1000);
}

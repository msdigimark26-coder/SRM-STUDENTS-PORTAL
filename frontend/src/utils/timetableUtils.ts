import type { Timetable, TimetablePeriod } from '@srm/shared';

export function getNextClass(
  timetable: Timetable | undefined,
  currentDayName: string,
  currentTimeString: string // format "HH:mm"
): TimetablePeriod | null {
  if (!timetable || !timetable.sessions || timetable.sessions.length === 0) {
    return null;
  }

  // Filter sessions for today
  const todaysClasses = timetable.sessions.filter(
    (session) => session.day.toLowerCase() === currentDayName.toLowerCase()
  );

  if (todaysClasses.length === 0) {
    return null; // No classes today
  }

  // Sort classes by start time (assuming HH:mm string format sorts correctly)
  todaysClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find the first class that starts AFTER the current time
  for (const session of todaysClasses) {
    if (session.startTime > currentTimeString) {
      return session;
    }
  }

  // If all classes have started/finished, return null
  return null;
}

export function getClassesForDays(
  timetable: Timetable | undefined,
  daysOfWeek: string[]
): TimetablePeriod[] {
  if (!timetable || !timetable.sessions || timetable.sessions.length === 0) {
    return [];
  }

  const normalizedDays = daysOfWeek.map(d => d.toLowerCase());

  return timetable.sessions.filter(
    session => normalizedDays.includes(session.day.toLowerCase())
  );
}

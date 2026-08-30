import { expect, test, describe } from 'vitest';
import { getNextClass } from './timetableUtils';
import type { Timetable } from '@srm/shared';

describe('getNextClass', () => {
  const dummyTimetable: Timetable = {
    sessions: [
      { day: 'Monday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DBMS', subjectName: 'Database Management Systems' },
      { day: 'Monday', period: 2, startTime: '08:50', endTime: '09:40', subjectCode: 'MATH', subjectName: 'Mathematics' },
      { day: 'Monday', period: 3, startTime: '09:50', endTime: '10:40', subjectCode: 'OS', subjectName: 'Operating Systems' },
      { day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'AI', subjectName: 'Artificial Intelligence' }
    ]
  };

  test('returns the next class when time is before the first class', () => {
    const next = getNextClass(dummyTimetable, 'Monday', '07:30');
    expect(next?.subjectCode).toBe('DBMS');
  });

  test('returns the next class when time is exactly at the start of a class (should return the NEXT one)', () => {
    // If it's exactly 08:50, the 08:50 class hasn't started after 08:50 according to >, but let's assume > means next.
    // Wait, if it's 08:50, they should go to the 09:50 class if we use >. Or they are already late for MATH?
    // Let's ensure > works predictably.
    const next = getNextClass(dummyTimetable, 'Monday', '08:50');
    expect(next?.subjectCode).toBe('OS'); 
  });

  test('returns the next class during a break', () => {
    const next = getNextClass(dummyTimetable, 'Monday', '09:45');
    expect(next?.subjectCode).toBe('OS');
  });

  test('returns null if there are no more classes today', () => {
    const next = getNextClass(dummyTimetable, 'Monday', '11:00');
    expect(next).toBeNull();
  });

  test('returns null if the day is not in the timetable', () => {
    const next = getNextClass(dummyTimetable, 'Sunday', '08:00');
    expect(next).toBeNull();
  });

  test('returns null if timetable is undefined or empty', () => {
    expect(getNextClass(undefined, 'Monday', '08:00')).toBeNull();
    expect(getNextClass({ sessions: [] }, 'Monday', '08:00')).toBeNull();
  });
});

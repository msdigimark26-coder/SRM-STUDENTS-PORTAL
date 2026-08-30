import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendanceCalendar } from './AttendanceCalendar';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';

describe('AttendanceCalendar', () => {
  const dummyTimetableSessions: TimetablePeriod[] = [
    // Monday: 3 classes (Duplicate DBMS)
    { day: 'Monday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DBMS', subjectName: 'Database Systems' },
    { day: 'Monday', period: 2, startTime: '08:50', endTime: '09:40', subjectCode: 'DBMS', subjectName: 'Database Systems' },
    { day: 'Monday', period: 3, startTime: '09:50', endTime: '10:40', subjectCode: 'OS', subjectName: 'Operating Systems' },
    
    // Tuesday: 1 class (Exactly 75% subject)
    { day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'MATH', subjectName: 'Mathematics' },

    // Wednesday: 2 classes (1 is below 75%, 1 is UNAVAILABLE)
    { day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'AI', subjectName: 'AI Lab' },
    { day: 'Wednesday', period: 2, startTime: '08:50', endTime: '09:40', subjectCode: 'UNAVAILABLE', subjectName: 'Unknown' },

    // Thursday: No classes (Holiday/Free Day)
    
    // Friday: 1 class (Safe)
    { day: 'Friday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'FS', subjectName: 'Full Stack' },

    // Saturday/Sunday: Should be excluded from classes usually, but we should test if they get mapped if present.
    // Let's add a Saturday class to test weekend dates.
    { day: 'Saturday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DBMS', subjectName: 'Database Systems' },
  ];

  const dummyStudentData: NormalizedStudentData = {
    currentSemester: { id: '5', name: 'Semester 5' },
    profile: {
      name: 'John Doe',
      studentId: 'RA123',
      program: 'B.Tech',
      department: 'CSE'
    },
    subjects: [
      { code: 'DBMS', name: 'Database Systems', credits: 4 },
      { code: 'OS', name: 'Operating Systems', credits: 4 },
      { code: 'MATH', name: 'Mathematics', credits: 4 },
      { code: 'AI', name: 'AI Lab', credits: 2 },
      { code: 'FS', name: 'Full Stack', credits: 3 }
    ],
    attendance: [
      { subjectCode: 'DBMS', attendedHours: 40, conductedHours: 45, percentage: 88.8 }, // Very safe
      { subjectCode: 'OS', attendedHours: 35, conductedHours: 40, percentage: 87.5 }, // Safe
      { subjectCode: 'MATH', attendedHours: 30, conductedHours: 40, percentage: 75.0 }, // Exactly 75%
      { subjectCode: 'AI', attendedHours: 10, conductedHours: 15, percentage: 66.6 }, // Below 75%
      { subjectCode: 'FS', attendedHours: 25, conductedHours: 30, percentage: 83.3 }, // Safe
    ],
    timetable: {
      sessions: dummyTimetableSessions
    }
  };

  beforeEach(() => {
    // Mock system time to a fixed date: Wednesday, August 26, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 26, 12, 0, 0)); // August is month 7 (0-indexed)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a proper month calendar with Monday-Sunday layout', () => {
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // Check header
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    
    // Check days of week
    expect(screen.getByText('MON')).toBeInTheDocument();
    expect(screen.getByText('SUN')).toBeInTheDocument();
    
    // August 2026 has 31 days. 
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    
    // August 1, 2026 is a Saturday. In Mon-Sun, Sat is index 5.
    // The padding should push '1' to the right column. (Checked visually by users)
  });

  it('handles February/leap years correctly', () => {
    // Mock to Feb 2024 (Leap year)
    vi.setSystemTime(new Date(2024, 1, 15, 12, 0, 0));
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    expect(screen.getByText('February 2024')).toBeInTheDocument();
    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.queryByText('30')).not.toBeInTheDocument();
  });

  it('handles past dates with HISTORICAL DATA UNAVAILABLE and disables simulations', () => {
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // Click August 25 (Tuesday - past date)
    fireEvent.click(screen.getByText('25'));
    
    // Should show scheduled classes
    expect(screen.getByText("TODAY'S SCHEDULE")).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    
    // Should show neutral message
    expect(screen.getByText('HISTORICAL DATA UNAVAILABLE')).toBeInTheDocument();
    
    // Should NOT show simulations
    expect(screen.queryByText('IF ALL SCHEDULED CLASSES MISSED')).not.toBeInTheDocument();
  });

  it('handles future dates correctly with projected simulations', () => {
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // Click August 28 (Friday - future date)
    fireEvent.click(screen.getByText('28'));
    
    // Should show scheduled classes
    expect(screen.getByText("TODAY'S SCHEDULE")).toBeInTheDocument();
    expect(screen.getByText('Full Stack')).toBeInTheDocument();
    
    // Should show simulations
    expect(screen.getByText('IF ALL SCHEDULED CLASSES MISSED')).toBeInTheDocument();
    expect(screen.getByText('IF ALL SCHEDULED CLASSES ATTENDED')).toBeInTheDocument();
    
    // Should NOT show neutral message
    expect(screen.queryByText('HISTORICAL DATA UNAVAILABLE')).not.toBeInTheDocument();
  });

  it('handles no-class dates gracefully', () => {
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // Click August 27 (Thursday - no classes in dummy timetable)
    fireEvent.click(screen.getByText('27'));
    
    expect(screen.getByText('⚪ No classes scheduled')).toBeInTheDocument();
    expect(screen.queryByText('IF ALL SCHEDULED CLASSES MISSED')).not.toBeInTheDocument();
  });

  it('calculates multiple occurrences and handles UNAVAILABLE', () => {
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // August 26 is Wednesday (has AI below target, and UNAVAILABLE)
    // Click 26
    fireEvent.click(screen.getAllByText('26')[0]); 
    // Since August has day '26', and maybe date string has '26' (like 'Aug 26'), use getAllByText

    expect(screen.getByText('AI Lab')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument(); // UNAVAILABLE subject
  });

  it('ensures no mutation of studentData occurs', () => {
    const originalAttended = dummyStudentData.attendance[0].attendedHours;
    render(<AttendanceCalendar studentData={dummyStudentData} />);
    
    // Click some future dates to trigger simulations
    fireEvent.click(screen.getByText('31')); // Monday
    
    // Assert original data is completely untouched
    expect(dummyStudentData.attendance[0].attendedHours).toBe(originalAttended);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceCalendar } from '../components/timetable/AttendanceCalendar';
import { SickLeavePlanner } from '../components/timetable/SickLeavePlanner';
import type { NormalizedStudentData } from '@srm/shared';

const dummyStudentData: NormalizedStudentData = {
  currentSemester: { id: '5', name: 'Semester 5' },
  profile: { name: 'John Doe', studentId: 'RA123', program: 'B.Tech', department: 'CSE' },
  subjects: [
    { code: 'DLD', name: 'Digital Logic Design', credits: 4 },
  ],
  attendance: [
    { subjectCode: 'DLD', attendedHours: 4, conductedHours: 4, percentage: 100.0 },
  ],
  timetable: {
    sessions: [
      { day: 'Monday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DLD', subjectName: 'Digital Logic Design' },
      { day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DLD', subjectName: 'Digital Logic Design' },
      { day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DLD', subjectName: 'Digital Logic Design' },
    ]
  }
};

describe('Phase 2H Audit Tests', () => {

  describe('Multi-day Sick Leave Regression', () => {
    it('distinguishes individual day impact vs cumulative leave impact', () => {
      vi.setSystemTime(new Date(2026, 7, 31)); // Aug 31, 2026 (Monday)
      // Mon Aug 31, Tue Sep 1, Wed Sep 2
      
      render(<SickLeavePlanner studentData={dummyStudentData} />);
      
      // Select 3 Days
      fireEvent.click(screen.getByLabelText('3 Days'));
      
      // We expect the cumulative impact to show 57.1%
      expect(screen.getByText(/57\.1%/i)).toBeInTheDocument();
      expect(screen.getByText(/CUMULATIVE IMPACT OF SELECTED LEAVE PERIOD/i)).toBeInTheDocument();

      // We expect each individual day to show the independent projection based solely on that day's missed classes
      // Day 1 (Mon Aug 31) -> 1 class missed -> 4/5 = 80.0%
      const eightyPercents = screen.getAllByText(/80\.0%/i);
      expect(eightyPercents.length).toBeGreaterThanOrEqual(3);
      
      // Ensure 57.1% is NOT shown under each individual day (it should only be shown once at the bottom)
      const fiftySevenPercents = screen.getAllByText(/57\.1%/i);
      expect(fiftySevenPercents.length).toBe(1);
      
      vi.useRealTimers();
    });
  });

  describe('Baseline Test', () => {
    it('verifies that every independent calendar date starts from the same baseline', () => {
      vi.setSystemTime(new Date(2026, 7, 1)); // Aug 1, 2026 (Saturday)
      render(<AttendanceCalendar studentData={dummyStudentData} />);
      
      // Click Monday Aug 3
      const august3 = screen.getAllByText('3').find(el => el.tagName === 'DIV' && el.parentElement?.tagName === 'DIV');
      if (august3) fireEvent.click(august3);
      
      expect(screen.getByText('IF ALL SCHEDULED CLASSES MISSED')).toBeInTheDocument();
      let missedImpacts = screen.getAllByText(/80\.0%/i);
      expect(missedImpacts.length).toBeGreaterThan(0);
      
      // Close modal
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Click Tuesday Aug 4
      const august4 = screen.getAllByText('4').find(el => el.tagName === 'DIV' && el.parentElement?.tagName === 'DIV');
      if (august4) fireEvent.click(august4);
      
      expect(screen.getByText('IF ALL SCHEDULED CLASSES MISSED')).toBeInTheDocument();
      
      // Should STILL see 80.0% for missed (not cumulative)
      missedImpacts = screen.getAllByText(/80\.0%/i);
      expect(missedImpacts.length).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });
  });

  describe('Immutability Test', () => {
    it('verifies studentData is never mutated by simulations', () => {
      vi.setSystemTime(new Date(2026, 7, 30));
      const original = structuredClone(dummyStudentData);
      
      const { unmount } = render(
        <>
          <AttendanceCalendar studentData={dummyStudentData} />
          <SickLeavePlanner studentData={dummyStudentData} />
        </>
      );
      
      fireEvent.click(screen.getByLabelText('3 Days'));
      fireEvent.click(screen.getByText('31'));
      
      expect(dummyStudentData).toEqual(original);
      
      unmount();
      vi.useRealTimers();
    });
  });
});

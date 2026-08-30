import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeeklyStrategyPlanner } from './WeeklyStrategyPlanner';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';

describe('WeeklyStrategyPlanner', () => {
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

    // Saturday/Sunday: Should be excluded
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
      // UNAVAILABLE intentionally omitted
    ],
    timetable: {
      sessions: dummyTimetableSessions
    }
  };

  it('renders Monday-Friday calculation and excludes weekends', () => {
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getAllByText('Wednesday').length).toBeGreaterThan(0);
    expect(screen.getByText('Friday')).toBeInTheDocument();
    
    // Saturday should not be rendered
    expect(screen.queryByText('Saturday')).toBeNull();
  });

  it('handles holidays / no-class days gracefully', () => {
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    
    // Thursday has no classes, so it shouldn't render a card
    expect(screen.queryByText('Thursday')).toBeNull();
  });

  it('identifies subjects below 75% and best recovery day', () => {
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    
    // AI Lab is below 75%. It occurs on Wednesday. 
    // Therefore Wednesday should be the best recovery day.
    expect(screen.getByText('Best recovery opportunity:')).toBeInTheDocument();
    expect(screen.getAllByText('Wednesday').length).toBeGreaterThan(0);
    
    // Avoid missing AI Lab
    expect(screen.getByText('🔴 AI Lab')).toBeInTheDocument();
  });

  it('classifies days correctly based on full-day simulation', () => {
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    
    // Friday only has FS (83%). Missing 1 FS class: 25/31 = 80.6% (>75%). Overall is safe.
    // So Friday should be Safe.
    const fridayCard = screen.getByText('Friday').parentElement;
    expect(fridayCard).toHaveTextContent('Safe');

    // Tuesday has Math (75%). Missing it drops to 30/41 = 73.1% (<75%).
    // So Tuesday should be High Risk.
    const tuesdayCard = screen.getByText('Tuesday').parentElement;
    expect(tuesdayCard).toHaveTextContent('High Risk');
  });

  it('calculates multiple occurrences correctly (DBMS x2)', () => {
    // Missing Monday means missing DBMS twice and OS once.
    // DBMS drops from 40/45 (88.8%) to 40/47 (85.1%). Still safe.
    // Overall stays safe.
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    const mondayCard = screen.getByText('Monday').parentElement;
    expect(mondayCard).toHaveTextContent('Safe');
  });

  it('does not mutate original student data', () => {
    const originalAttended = dummyStudentData.attendance[0].attendedHours;
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={vi.fn()} />);
    expect(dummyStudentData.attendance[0].attendedHours).toBe(originalAttended);
  });

  it('Plan My Week radio buttons trigger setPlanMode correctly', () => {
    const setPlanModeMock = vi.fn();
    render(<WeeklyStrategyPlanner studentData={dummyStudentData} planMode={null} setPlanMode={setPlanModeMock} />);
    
    const radio = screen.getByLabelText('I need to bunk 1–2 periods');
    fireEvent.click(radio);
    
    expect(setPlanModeMock).toHaveBeenCalledWith('bunk');
  });
});

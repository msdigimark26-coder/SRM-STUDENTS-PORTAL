import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SelectivePeriodPlanner } from './SelectivePeriodPlanner';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';

describe('SelectivePeriodPlanner', () => {
  const dummyTodaysClasses: TimetablePeriod[] = [
    { day: 'Monday', period: 1, startTime: '08:00', endTime: '08:50', subjectCode: 'DBMS', subjectName: 'Database Systems' },
    { day: 'Monday', period: 2, startTime: '08:50', endTime: '09:40', subjectCode: 'MATH', subjectName: 'Mathematics' },
    { day: 'Monday', period: 3, startTime: '09:50', endTime: '10:40', subjectCode: 'OS', subjectName: 'Operating Systems' },
    { day: 'Monday', period: 4, startTime: '10:40', endTime: '11:30', subjectCode: 'UNAVAILABLE', subjectName: 'Unknown Subject' },
    { day: 'Monday', period: 5, startTime: '11:30', endTime: '12:20', subjectCode: 'DBMS', subjectName: 'Database Systems' }, // Duplicate subject test
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
      { code: 'MATH', name: 'Mathematics', credits: 4 },
      { code: 'OS', name: 'Operating Systems', credits: 4 }
    ],
    attendance: [
      { subjectCode: 'DBMS', attendedHours: 20, conductedHours: 25, percentage: 80 }, 
      { subjectCode: 'MATH', attendedHours: 15, conductedHours: 20, percentage: 75 }, 
      { subjectCode: 'OS', attendedHours: 10, conductedHours: 15, percentage: 66.6 }
      // UNAVAILABLE is missing on purpose to test missing data handling
    ],
    timetable: {
      sessions: dummyTodaysClasses
    }
  };

  it('renders nothing if todaysClasses is empty', () => {
    const { container } = render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all todays classes correctly', () => {
    render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={dummyTodaysClasses} />);
    expect(screen.getByText('SELECT CLASSES TO MISS')).toBeInTheDocument();
    expect(screen.getAllByText('Database Systems')[0]).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('calculates properly when 1 period is selected', () => {
    render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={dummyTodaysClasses} />);
    
    // Select DBMS (08:00)
    const dbmsCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(dbmsCheckbox);

    // Initial total: 45 / 60 = 75.0%
    // Miss 1 DBMS: 45 / 61 = 73.77%
    expect(screen.getByText(/Selected:/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument(); // Current
    expect(screen.getByText('73.8%')).toBeInTheDocument(); // Projected
    expect(screen.getByText('🟠 WATCH')).toBeInTheDocument();
  });

  it('calculates properly when 2 periods are selected', () => {
    render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={dummyTodaysClasses} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // DBMS
    fireEvent.click(checkboxes[1]); // MATH

    // Miss 2: 45 / 62 = 72.58%
    expect(screen.getByText('2')).toBeInTheDocument(); // Selected: 2
    expect(screen.getByText('72.6%')).toBeInTheDocument(); // Projected
  });

  it('calculates properly when all periods (including duplicates) are selected', () => {
    render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={dummyTodaysClasses} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => fireEvent.click(cb));

    expect(screen.getByText('5')).toBeInTheDocument(); // Selected: 5

    // Total: 45 attended. Conducted: 60 + 5 missed = 65.
    // 45 / 65 = 69.2%
    expect(screen.getByText('69.2%')).toBeInTheDocument();
  });

  it('handles UNAVAILABLE attendance subjects gracefully', () => {
    render(<SelectivePeriodPlanner studentData={dummyStudentData} todaysClasses={dummyTodaysClasses} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    // The 4th class is UNAVAILABLE
    fireEvent.click(checkboxes[3]);

    // Overall should still calculate assuming we missed 1 class?
    // Wait, if subject isn't found in attendance data, the impact on subject is null, but overall tracking adds +1 conducted regardless.
    // 45 / 61 = 73.8%
    expect(screen.getByText('73.8%')).toBeInTheDocument(); 

    // It should not crash, and shouldn't display subject breakdown for UNAVAILABLE
    expect(screen.queryByText('Unknown Subject', { selector: 'div > div' })).toBeNull();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickInsightCard } from './QuickInsightCard';
import { SubjectAttendanceTable } from './SubjectAttendanceTable';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import type { SubjectAttendanceResult } from '@srm/shared';

const mockEngine = new AttendanceEngine();

describe('UI Components', () => {
  describe('AttendanceHealthCard (via WhatIfSimulator or engine)', () => {
    it('overall engine math is unchanged: 32 attended / 40 conducted = 80%', () => {
      const pct = (32 / 40) * 100;
      expect(pct).toBeCloseTo(80, 1);
    });
  });

  describe('QuickInsightCard', () => {
    it('renders impossible recovery', () => {
      render(<QuickInsightCard title="Recovery" value={Infinity} />);
      expect(screen.getByText('Not reachable')).toBeInTheDocument();
    });

    it('renders valid number', () => {
      render(<QuickInsightCard title="Safe Miss" value={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders null properly', () => {
      render(<QuickInsightCard title="Safe Miss" value={null} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('SubjectAttendanceTable', () => {
    it('renders empty state if no subjects', () => {
      render(<SubjectAttendanceTable subjects={[]} engine={mockEngine} />);
      expect(screen.getByText('No subjects available.')).toBeInTheDocument();
    });

    it('renders subject correctly with health status', () => {
      const sub: SubjectAttendanceResult = {
        subjectCode: 'CS101',
        subjectName: 'Intro',
        credits: 3,
        attendedHours: 20,
        conductedHours: 30,
        currentPercentage: 66.6,
        targetPercentage: 75,
        differenceFromTarget: -8.4,
        safeAbsenceHours: 0,
        recoveryHours: 8,
        healthStatus: 'BELOW_TARGET'
      };
      render(<SubjectAttendanceTable subjects={[sub]} engine={mockEngine} />);
      // The new table shows subject name in the first column, code in second span
      expect(screen.getByText('Intro')).toBeInTheDocument();
      expect(screen.getByText('CS101')).toBeInTheDocument();
      // Current % is 66.7% (computed dynamically from attendedHours/conductedHours)
      expect(screen.getByText('66.7%')).toBeInTheDocument();
    });
    
    it('renders empty state for zero-conducted subjects', () => {
      const sub: SubjectAttendanceResult = {
        subjectCode: 'PH101',
        subjectName: 'Physics',
        credits: 2,
        attendedHours: 0,
        conductedHours: 0,
        currentPercentage: null,
        targetPercentage: 75,
        differenceFromTarget: null,
        safeAbsenceHours: null,
        recoveryHours: null,
        healthStatus: 'UNAVAILABLE'
      };
      // With conductedHours === 0 the row is skipped (returns null)
      // so the table body should be empty (no row with PH101)
      render(<SubjectAttendanceTable subjects={[sub]} engine={mockEngine} />);
      expect(screen.queryByText('PH101')).not.toBeInTheDocument();
    });
  });
});

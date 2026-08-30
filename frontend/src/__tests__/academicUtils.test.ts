import { calculateSGPA, calculateCGPA, calculateRequiredSGPA, getGradePoint } from '../utils/academicUtils';
import type { AcademicSubject } from '@srm/shared';

describe('Academic Utilities', () => {
  describe('Grading Scale', () => {
    it('returns correct points for SRM grading scale', () => {
      expect(getGradePoint('O')).toBe(10);
      expect(getGradePoint('A+')).toBe(9);
      expect(getGradePoint('A')).toBe(8);
      expect(getGradePoint('B+')).toBe(7);
      expect(getGradePoint('B')).toBe(6);
      expect(getGradePoint('C')).toBe(5);
      expect(getGradePoint('F')).toBe(0);
      expect(getGradePoint('Ab')).toBe(0);
      expect(getGradePoint('None')).toBe(0);
      expect(getGradePoint(undefined)).toBe(0);
    });
  });

  describe('calculateSGPA', () => {
    it('calculates weighted SGPA correctly', () => {
      const subjects: AcademicSubject[] = [
        { code: 'S1', name: 'S1', credits: 4, expectedGrade: 'A' }, // 4 * 8 = 32
        { code: 'S2', name: 'S2', credits: 3, expectedGrade: 'A+' } // 3 * 9 = 27
      ];
      // Total QP = 59, Total Credits = 7
      // SGPA = 59 / 7 = 8.42857...
      
      const res = calculateSGPA(subjects);
      expect(res.totalCredits).toBe(7);
      expect(res.qualityPoints).toBe(59);
      expect(res.sgpa).toBeCloseTo(8.42857, 4);
    });

    it('ignores subjects with no grade', () => {
      const subjects: AcademicSubject[] = [
        { code: 'S1', name: 'S1', credits: 4, expectedGrade: 'A' },
        { code: 'S2', name: 'S2', credits: 3, expectedGrade: 'None' }
      ];
      const res = calculateSGPA(subjects);
      expect(res.totalCredits).toBe(4);
      expect(res.sgpa).toBe(8);
    });
  });

  describe('calculateCGPA', () => {
    it('calculates CGPA by weighting semester credits (not simple average)', () => {
      const semesters = [
        { id: '1', name: 'Sem 1', credits: 20, sgpa: 9.0 }, // 180
        { id: '2', name: 'Sem 2', credits: 10, sgpa: 8.0 }  // 80
      ];
      // Total QP = 260, Total Credits = 30
      // CGPA = 260 / 30 = 8.666...
      
      const res = calculateCGPA(semesters);
      expect(res.cgpa).toBeCloseTo(8.6666, 3);
    });
  });

  describe('calculateRequiredSGPA', () => {
    it('calculates required SGPA for an achievable target', () => {
      // current CGPA 8.12, completed 82, current sem 20, target 8.5
      const res = calculateRequiredSGPA(8.12, 82, 20, 8.5);
      // required QP = (8.5 * 102) - (8.12 * 82) = 867 - 665.84 = 201.16
      // required SGPA = 201.16 / 20 = 10.058 -> practically impossible but mathematically correct
      expect(res.requiredSGPA).toBeCloseTo(10.058, 3);
      expect(res.possible).toBe(false);
    });

    it('identifies an achievable target correctly', () => {
      const res = calculateRequiredSGPA(8.12, 82, 20, 8.2);
      expect(res.requiredSGPA).toBeLessThanOrEqual(10);
      expect(res.possible).toBe(true);
    });
  });
});

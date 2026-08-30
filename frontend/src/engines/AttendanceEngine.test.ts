import { describe, it, expect, beforeEach } from 'vitest';
import { AttendanceEngine } from './AttendanceEngine';
import type { Subject, AttendanceRecord } from '@srm/shared';

describe('AttendanceEngine Core Calculations', () => {
  let engine: AttendanceEngine;

  beforeEach(() => {
    engine = new AttendanceEngine(); // Default target 75%
  });

  describe('calculateCurrent', () => {
    it('calculates current percentage correctly', () => {
      expect(engine.calculateCurrent(30, 40)).toBe(75);
      expect(engine.calculateCurrent(75, 100)).toBe(75);
    });

    it('handles conducted = 0', () => {
      expect(engine.calculateCurrent(0, 0)).toBe(null);
    });

    it('handles attended = 0', () => {
      expect(engine.calculateCurrent(0, 10)).toBe(0);
    });

    it('handles attended = conducted', () => {
      expect(engine.calculateCurrent(50, 50)).toBe(100);
    });

    it('handles high conducted hours', () => {
      expect(engine.calculateCurrent(950, 1000)).toBe(95);
    });

    it('throws on invalid negative hours', () => {
      expect(() => engine.calculateCurrent(-1, 10)).toThrow('Invalid hours');
      expect(() => engine.calculateCurrent(10, -1)).toThrow('Invalid hours');
    });

    it('throws if attended > conducted', () => {
      expect(() => engine.calculateCurrent(15, 10)).toThrow('Attended cannot be greater than conducted');
    });
  });

  describe('calculateProjected', () => {
    it('projects accurately for varied inputs', () => {
      expect(engine.calculateProjected(30, 40, 1, 0)).toBe((31/41)*100);
      expect(engine.calculateProjected(30, 40, 0, 1)).toBe((30/41)*100);
      expect(engine.calculateProjected(30, 40, 2, 3)).toBe((32/45)*100);
    });

    it('handles attend next class', () => {
      expect(engine.calculateAttendNext(30, 40)).toBe((31/41)*100);
    });

    it('handles miss next class', () => {
      expect(engine.calculateMissNext(30, 40)).toBe((30/41)*100);
    });
  });

  describe('calculateSafeAbsence', () => {
    it('calculates 0 if below target', () => {
      expect(engine.calculateSafeAbsence(29, 40)).toBe(0); // 72.5%
    });

    it('calculates exactly 75%', () => {
      expect(engine.calculateSafeAbsence(30, 40)).toBe(0); // 75% -> miss 1 = 30/41 = 73.1% (fails)
    });

    it('calculates slightly above 75%', () => {
      expect(engine.calculateSafeAbsence(31, 40)).toBe(1); // 77.5% -> miss 1 = 31/41 = 75.6% (passes). miss 2 = 31/42 = 73.8% (fails)
    });

    it('calculates 100% attendance', () => {
      expect(engine.calculateSafeAbsence(40, 40)).toBe(13); // 40/53 = 75.47%. 40/54 = 74.07%
    });

    it('handles target 0%', () => {
      const zeroEngine = new AttendanceEngine({ targetPercentage: 0 });
      expect(zeroEngine.calculateSafeAbsence(10, 10)).toBe(Infinity);
    });

    it('returns null if conducted = 0', () => {
      expect(engine.calculateSafeAbsence(0, 0)).toBe(null);
    });
  });

  describe('calculateRecoveryHours', () => {
    it('returns 0 if already at or above target', () => {
      expect(engine.calculateRecoveryHours(30, 40)).toBe(0);
      expect(engine.calculateRecoveryHours(35, 40)).toBe(0);
    });

    it('calculates slightly below 75%', () => {
      expect(engine.calculateRecoveryHours(29, 40)).toBe(4); // 29/40 = 72.5%. +4 = 33/44=75%
      expect(engine.calculateRecoveryHours(32, 43)).toBe(1); // 32/43 = 74.4%. +1 = 33/44=75%
    });

    it('calculates very low attendance', () => {
      expect(engine.calculateRecoveryHours(10, 40)).toBe(80); // 10/40 = 25%. Need 80 more: 90/120 = 75%
    });

    it('returns Infinity if target is 100% and currently below', () => {
      const strictEngine = new AttendanceEngine({ targetPercentage: 100 });
      expect(strictEngine.calculateRecoveryHours(99, 100)).toBe(Infinity);
    });

    it('returns null if conducted = 0', () => {
      expect(engine.calculateRecoveryHours(0, 0)).toBe(null);
    });
  });

  describe('determineHealthStatus', () => {
    it('classifies SAFE', () => {
      expect(engine.determineHealthStatus(32, 40)).toBe('SAFE'); // 80%
    });

    it('classifies WATCH', () => {
      expect(engine.determineHealthStatus(30, 40)).toBe('WATCH'); // 75%
      expect(engine.determineHealthStatus(31, 40)).toBe('WATCH'); // 77.5%
    });

    it('classifies AT_RISK', () => {
      expect(engine.determineHealthStatus(28, 40)).toBe('AT_RISK'); // 70%
      expect(engine.determineHealthStatus(29, 40)).toBe('AT_RISK'); // 72.5%
    });

    it('classifies BELOW_TARGET', () => {
      expect(engine.determineHealthStatus(27, 40)).toBe('BELOW_TARGET'); // 67.5%
      expect(engine.determineHealthStatus(10, 40)).toBe('BELOW_TARGET'); // 25%
    });

    it('classifies UNAVAILABLE if conducted = 0', () => {
      expect(engine.determineHealthStatus(0, 0)).toBe('UNAVAILABLE');
    });
  });

  describe('processSubjects', () => {
    it('maps correctly and rounds display values', () => {
      const subjects: Subject[] = [
        { code: 'CS101', name: 'Intro', credits: 3 },
        { code: 'MA101', name: 'Math', credits: 4 },
        { code: 'PH101', name: 'Physics', credits: 2 }
      ];
      const records: AttendanceRecord[] = [
        { subjectCode: 'CS101', attendedHours: 29, conductedHours: 40, percentage: 72.5 },
        { subjectCode: 'MA101', attendedHours: 35, conductedHours: 40, percentage: 87.5 },
        { subjectCode: 'PH101', attendedHours: 0, conductedHours: 0, percentage: 0 }
      ];

      const results = engine.processSubjects(subjects, records);
      expect(results.length).toBe(3);

      const cs = results.find(r => r.subjectCode === 'CS101');
      expect(cs?.currentPercentage).toBe(72.5);
      expect(cs?.healthStatus).toBe('AT_RISK');
      expect(cs?.recoveryHours).toBe(4);
      expect(cs?.safeAbsenceHours).toBe(0);

      const ma = results.find(r => r.subjectCode === 'MA101');
      expect(ma?.currentPercentage).toBe(87.5);
      expect(ma?.healthStatus).toBe('SAFE');
      expect(ma?.recoveryHours).toBe(0);
      expect(ma?.safeAbsenceHours).toBe(6); // 35/46 = 76.08%. 35/47 = 74.4%
      
      const ph = results.find(r => r.subjectCode === 'PH101');
      expect(ph?.currentPercentage).toBe(null);
      expect(ph?.healthStatus).toBe('UNAVAILABLE');
      expect(ph?.recoveryHours).toBe(null);
      expect(ph?.safeAbsenceHours).toBe(null);
    });
  });

  describe('Engine Configuration', () => {
    it('throws on invalid target percentage', () => {
      expect(() => new AttendanceEngine({ targetPercentage: -1 })).toThrow('Invalid target percentage');
      expect(() => new AttendanceEngine({ targetPercentage: 101 })).toThrow('Invalid target percentage');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { AttendanceEngine } from './AttendanceEngine';

describe('AttendanceEngine - Regression Tests', () => {
  const engine = new AttendanceEngine();

  describe('Core Attendance Formula', () => {
    it('calculates 7/7 -> miss 1 -> 87.5%', () => {
      const projected = engine.calculateProjected(7, 7, 0, 1);
      expect(projected).toBe(87.5);
    });

    it('calculates 5/5 -> miss 2 -> 71.4%', () => {
      const projected = engine.calculateProjected(5, 5, 0, 2);
      // Math: 5 / 7 = 0.7142857...
      expect(projected).toBeCloseTo(71.42857, 5);
      
      // Formatting handles the display rounding
      expect(AttendanceEngine.formatDisplayValue(projected)).toBe(71.4);
    });

    it('calculates 5/5 -> attend 2 -> 100%', () => {
      const projected = engine.calculateProjected(5, 5, 2, 0);
      expect(projected).toBe(100);
    });

    it('calculates 5/5 -> attend 2 + miss 3 -> 70%', () => {
      const projected = engine.calculateProjected(5, 5, 2, 3);
      expect(projected).toBe(70);
    });

    it('calculates 2/3 -> attend 1 -> 75%', () => {
      const projected = engine.calculateProjected(2, 3, 1, 0);
      expect(projected).toBe(75);
    });
  });

  describe('Recovery Calculation', () => {
    it('calculates recovery classes accurately based on raw counts', () => {
      // 2/3 is 66.7%. Attending 1 class makes it 3/4 = 75%. So recovery is 1.
      expect(engine.calculateRecoveryHours(2, 3)).toBe(1);

      // 4/7 is 57.1%. We need to reach 75%.
      // 4+N / 7+N = 0.75
      // 4+N = 5.25 + 0.75N
      // 0.25N = 1.25 -> N = 5.
      // 9/12 = 75%. So recovery is 5.
      expect(engine.calculateRecoveryHours(4, 7)).toBe(5);

      // Already above target
      expect(engine.calculateRecoveryHours(4, 5)).toBe(0);
      expect(engine.calculateRecoveryHours(4, 4)).toBe(0);
    });
  });
});

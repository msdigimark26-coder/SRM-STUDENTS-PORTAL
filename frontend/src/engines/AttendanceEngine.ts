import type { 
  Subject, 
  AttendanceRecord, 
  SubjectAttendanceResult, 
  HealthStatus 
} from '@srm/shared';

export interface EngineConfig {
  targetPercentage: number;
  safeBuffer: number;
  riskBuffer: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  targetPercentage: 75,
  safeBuffer: 5,   // Safe if >= 80%
  riskBuffer: 5    // At risk if >= 70% and < 75%
};

export class AttendanceEngine {
  private config: EngineConfig;

  constructor(config: Partial<EngineConfig> = {}) {
    let defaultTarget = DEFAULT_CONFIG.targetPercentage;
    try {
      const savedTarget = localStorage.getItem('bunk_adkirow_target');
      if (savedTarget) {
        const parsed = parseFloat(savedTarget);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          defaultTarget = parsed;
        }
      }
    } catch (e) {
      // Ignore localStorage errors (e.g., SSR or incognito)
    }

    this.config = { ...DEFAULT_CONFIG, targetPercentage: defaultTarget, ...config };
    if (this.config.targetPercentage < 0 || this.config.targetPercentage > 100) {
      throw new Error("Invalid target percentage");
    }
  }

  public calculateCurrent(attended: number, conducted: number): number | null {
    if (attended < 0 || conducted < 0) throw new Error("Invalid hours");
    if (conducted === 0) return null;
    if (attended > conducted) throw new Error("Attended cannot be greater than conducted");
    return (attended / conducted) * 100;
  }

  public calculateProjected(
    attended: number, 
    conducted: number, 
    additionalAttended: number, 
    additionalMissed: number
  ): number | null {
    if (attended < 0 || conducted < 0 || additionalAttended < 0 || additionalMissed < 0) {
      throw new Error("Invalid hours");
    }
    const newAttended = attended + additionalAttended;
    const newConducted = conducted + additionalAttended + additionalMissed;
    if (newConducted === 0) return null;
    return (newAttended / newConducted) * 100;
  }

  public calculateAttendNext(attended: number, conducted: number): number | null {
    return this.calculateProjected(attended, conducted, 1, 0);
  }

  public calculateMissNext(attended: number, conducted: number): number | null {
    return this.calculateProjected(attended, conducted, 0, 1);
  }

  public calculateSafeAbsence(attended: number, conducted: number): number | null {
    const current = this.calculateCurrent(attended, conducted);
    if (current === null) return null;
    if (current < this.config.targetPercentage) return 0;

    if (this.config.targetPercentage === 0) return Infinity;
    const k = (attended * 100 - this.config.targetPercentage * conducted) / this.config.targetPercentage;
    return Math.max(0, Math.floor(k));
  }

  public calculateRecoveryHours(attended: number, conducted: number): number | null {
    const current = this.calculateCurrent(attended, conducted);
    if (current === null) return null;
    if (current >= this.config.targetPercentage) return 0;
    if (this.config.targetPercentage === 100) return Infinity;

    const k = (this.config.targetPercentage * conducted - attended * 100) / (100 - this.config.targetPercentage);
    return Math.max(0, Math.ceil(k));
  }

  public calculateDifference(attended: number, conducted: number): number | null {
    const current = this.calculateCurrent(attended, conducted);
    if (current === null) return null;
    return current - this.config.targetPercentage;
  }

  public determineHealthStatus(attended: number, conducted: number): HealthStatus {
    const current = this.calculateCurrent(attended, conducted);
    if (current === null) return 'UNAVAILABLE';
    
    const { targetPercentage, safeBuffer, riskBuffer } = this.config;

    if (current >= targetPercentage + safeBuffer) {
      return 'SAFE';
    } else if (current >= targetPercentage) {
      return 'WATCH';
    } else if (current >= targetPercentage - riskBuffer) {
      return 'AT_RISK';
    } else {
      return 'BELOW_TARGET';
    }
  }

  public static formatDisplayValue(value: number | null): number | null {
    if (value === null) return null;
    if (value === Infinity) return value;
    return Math.round(value * 10) / 10;
  }

  public processSubjects(
    subjects: Subject[], 
    attendanceRecords: AttendanceRecord[]
  ): SubjectAttendanceResult[] {
    const attendanceMap = new Map(attendanceRecords.map(a => [a.subjectCode, a]));

    return subjects.map(subject => {
      const record = attendanceMap.get(subject.code);
      const attended = record?.attendedHours || 0;
      const conducted = record?.conductedHours || 0;

      const currentRaw = this.calculateCurrent(attended, conducted);
      const diffRaw = this.calculateDifference(attended, conducted);

      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        credits: subject.credits,
        attendedHours: attended,
        conductedHours: conducted,
        currentPercentage: AttendanceEngine.formatDisplayValue(currentRaw),
        targetPercentage: this.config.targetPercentage,
        differenceFromTarget: AttendanceEngine.formatDisplayValue(diffRaw),
        safeAbsenceHours: this.calculateSafeAbsence(attended, conducted),
        recoveryHours: this.calculateRecoveryHours(attended, conducted),
        healthStatus: this.determineHealthStatus(attended, conducted)
      };
    });
  }
}

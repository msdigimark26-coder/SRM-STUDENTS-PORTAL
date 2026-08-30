import type { HealthStatus } from './types';

export type AttendanceInput = {
  attended: number;
  conducted: number;
};

export type SimulationChanges = {
  attend?: number;
  miss?: number;
};

export type SimulationParams = {
  current: AttendanceInput;
  changes?: SimulationChanges;
  targetPercentage?: number;
  safeBuffer?: number;
  riskBuffer?: number;
};

export type SimulationResult = {
  attended: number;
  conducted: number;
  percentage: number;
  status: HealthStatus;
};

export function determineHealthStatus(
  percentage: number,
  targetPercentage: number = 75,
  safeBuffer: number = 5,
  riskBuffer: number = 5
): HealthStatus {
  if (percentage >= targetPercentage + safeBuffer) {
    return 'SAFE';
  } else if (percentage >= targetPercentage) {
    return 'WATCH';
  } else if (percentage >= targetPercentage - riskBuffer) {
    return 'AT_RISK';
  } else {
    return 'BELOW_TARGET';
  }
}

export function simulateAttendance(params: SimulationParams): SimulationResult {
  const { current, changes = {} } = params;
  
  const attendClasses = changes.attend || 0;
  const missClasses = changes.miss || 0;

  const newAttended = current.attended + attendClasses;
  const newConducted = current.conducted + attendClasses + missClasses;

  let newPercentage = 0;
  if (newConducted > 0) {
    newPercentage = (newAttended / newConducted) * 100;
  }

  const status = determineHealthStatus(
    newPercentage, 
    params.targetPercentage, 
    params.safeBuffer, 
    params.riskBuffer
  );

  return {
    attended: newAttended,
    conducted: newConducted,
    percentage: newPercentage,
    status
  };
}

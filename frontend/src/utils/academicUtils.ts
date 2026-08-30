import type { SRMGrade, AcademicSubject, SemesterRecord } from '@srm/shared';

export const SRM_GRADING_SCALE: Record<SRMGrade, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'F': 0,
  'Ab': 0,
  'None': 0,
};

export function getGradePoint(grade: SRMGrade | undefined): number {
  if (!grade || grade === 'None') return 0;
  return SRM_GRADING_SCALE[grade] || 0;
}

export function calculateSGPA(subjects: AcademicSubject[], useExpected: boolean = true): { sgpa: number, totalCredits: number, qualityPoints: number } {
  let totalCredits = 0;
  let qualityPoints = 0;

  for (const subject of subjects) {
    if (subject.credits > 0) {
      const grade = useExpected ? (subject.expectedGrade || subject.finalGrade) : subject.finalGrade;
      
      // If we are strictly calculating SGPA and a subject has no grade yet, do we include it in credits?
      // Usually, SGPA is calculated only on graded subjects. But for predictability, we should probably 
      // only sum credits of subjects that have a grade selected (other than 'None').
      if (grade && grade !== 'None') {
        const point = getGradePoint(grade);
        totalCredits += subject.credits;
        qualityPoints += (subject.credits * point);
      }
    }
  }

  const sgpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;
  return { sgpa, totalCredits, qualityPoints };
}

export function calculateCGPA(pastSemesters: SemesterRecord[], currentSemesterSGPA?: number, currentSemesterCredits?: number): { cgpa: number, totalCredits: number } {
  let totalCredits = 0;
  let qualityPoints = 0;

  for (const sem of pastSemesters) {
    if (sem.credits > 0) {
      totalCredits += sem.credits;
      qualityPoints += (sem.credits * sem.sgpa);
    }
  }

  if (currentSemesterSGPA !== undefined && currentSemesterCredits !== undefined && currentSemesterCredits > 0) {
    totalCredits += currentSemesterCredits;
    qualityPoints += (currentSemesterCredits * currentSemesterSGPA);
  }

  const cgpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;
  return { cgpa, totalCredits };
}

export function calculateRequiredSGPA(currentCGPA: number, completedCredits: number, currentSemesterCredits: number, targetCGPA: number): { requiredSGPA: number, possible: boolean } {
  if (currentSemesterCredits <= 0) return { requiredSGPA: 0, possible: false };

  const totalCreditsTarget = completedCredits + currentSemesterCredits;
  const targetQualityPoints = targetCGPA * totalCreditsTarget;
  const currentQualityPoints = currentCGPA * completedCredits;

  const requiredQualityPoints = targetQualityPoints - currentQualityPoints;
  const requiredSGPA = requiredQualityPoints / currentSemesterCredits;

  const possible = requiredSGPA <= 10.0;

  return { requiredSGPA, possible };
}

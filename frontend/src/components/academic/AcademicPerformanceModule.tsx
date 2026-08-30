import React, { useState, useEffect } from 'react';
import type { NormalizedStudentData, AcademicSubject, SemesterRecord, SRMGrade } from '@srm/shared';
import { SGPACalculator } from './SGPACalculator';
import { CGPACalculator } from './CGPACalculator';
import { GradePredictor } from './GradePredictor';
import { GPAWhatIfSimulator } from './GPAWhatIfSimulator';
import { calculateCGPA } from '../../utils/academicUtils';

interface AcademicPerformanceModuleProps {
  studentData: NormalizedStudentData;
  onUpdateAcademicData: (academic: { pastSemesters: SemesterRecord[], currentSubjects: AcademicSubject[] }) => void;
}

export const AcademicPerformanceModule: React.FC<AcademicPerformanceModuleProps> = ({ studentData, onUpdateAcademicData }) => {
  const initialSemesters = studentData.academic?.pastSemesters || [];
  
  // Merge current subjects from Attendance engine if they exist, to pre-populate academic subjects
  const existingAcademicSubjects = studentData.academic?.currentSubjects || [];
  const mergedSubjects: AcademicSubject[] = studentData.subjects.map(sub => {
    const existing = existingAcademicSubjects.find(s => s.code === sub.code);
    return existing ? existing : { ...sub, expectedGrade: 'None' as SRMGrade };
  });

  const [semesters, setSemesters] = useState<SemesterRecord[]>(initialSemesters);
  const [subjects, setSubjects] = useState<AcademicSubject[]>(mergedSubjects);

  // Sync to parent component when local state changes
  useEffect(() => {
    onUpdateAcademicData({
      pastSemesters: semesters,
      currentSubjects: subjects
    });
  }, [semesters, subjects]);

  const { cgpa, totalCredits } = calculateCGPA(semesters);
  const totalPotentialCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(16, 185, 129, 0.05))', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.5rem' }}>Academic Performance</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Plan, simulate, and predict your SGPA & CGPA mathematically.</p>
      </div>

      {/* Main Grid: Left Column (Current Semester) / Right Column (Past & Prediction) */}
      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GPAWhatIfSimulator 
            subjects={subjects}
            onSubjectsChange={setSubjects}
          />
          <SGPACalculator 
            subjects={subjects}
            onSubjectsChange={setSubjects}
          />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GradePredictor 
            currentCGPA={cgpa}
            completedCredits={totalCredits}
            currentSemesterCredits={totalPotentialCredits > 0 ? totalPotentialCredits : 20}
          />
          <CGPACalculator 
            pastSemesters={semesters}
            onSemestersChange={setSemesters}
          />
        </div>

      </div>
    </div>
  );
};

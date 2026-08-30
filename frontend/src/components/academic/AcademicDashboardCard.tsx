import React from 'react';
import { GraduationCap, Target } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';
import { calculateCGPA, calculateSGPA } from '../../utils/academicUtils';

interface AcademicDashboardCardProps {
  studentData: NormalizedStudentData;
  onViewPlanner: () => void;
}

export const AcademicDashboardCard: React.FC<AcademicDashboardCardProps> = ({ studentData, onViewPlanner }) => {
  const academic = studentData.academic;
  const pastSemesters = academic?.pastSemesters || [];
  const currentSubjects = academic?.currentSubjects || [];

  // Calculate SGPA
  const { sgpa: currentSGPA, totalCredits: currentSemesterCredits } = calculateSGPA(currentSubjects, true);
  
  // Calculate CGPA
  const { cgpa: currentCGPA, totalCredits: pastCredits } = calculateCGPA(pastSemesters);
  
  // Projected CGPA combining both
  const { cgpa: projectedCGPA } = calculateCGPA(pastSemesters, currentSGPA, currentSemesterCredits);

  return (
    <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={20} color="#8b5cf6" /> ACADEMIC PERFORMANCE
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', borderRadius: '4px', fontWeight: 600 }}>SRMIST</span>
      </div>

      <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current CGPA</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{currentCGPA > 0 ? currentCGPA.toFixed(2) : '--'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{pastCredits} Credits Completed</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Expected SGPA</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{currentSGPA > 0 ? currentSGPA.toFixed(2) : '--'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{currentSemesterCredits} Semester Credits</div>
        </div>
      </div>

      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Projected CGPA (with expected grades)</span>
        </div>
        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{projectedCGPA > 0 ? projectedCGPA.toFixed(2) : '--'}</span>
      </div>

      <button onClick={onViewPlanner} style={{ width: '100%', padding: '0.75rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'} onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}>
        View GPA Planner
      </button>
    </div>
  );
};

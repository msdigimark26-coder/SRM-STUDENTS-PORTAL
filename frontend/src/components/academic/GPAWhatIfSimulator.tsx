import React from 'react';
import type { AcademicSubject, SRMGrade } from '@srm/shared';
import { calculateSGPA } from '../../utils/academicUtils';
import { HelpCircle } from 'lucide-react';

interface GPAWhatIfSimulatorProps {
  subjects: AcademicSubject[];
  onSubjectsChange: (subjects: AcademicSubject[]) => void;
}

const GRADES: SRMGrade[] = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'Ab'];

export const GPAWhatIfSimulator: React.FC<GPAWhatIfSimulatorProps> = ({ subjects, onSubjectsChange }) => {
  const { sgpa } = calculateSGPA(subjects, true);

  const handleGradeChange = (index: number, grade: SRMGrade) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], expectedGrade: grade };
    onSubjectsChange(newSubjects);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <HelpCircle size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>What-If Simulator</h3>
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Quickly toggle grades to see how your SGPA will be affected.
      </p>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Projected SGPA</div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)' }}>{sgpa > 0 ? sgpa.toFixed(2) : '0.00'}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {subjects.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No subjects added to simulate.
          </div>
        )}
        
        {subjects.map((sub, idx) => (
          <div key={idx} style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{sub.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {sub.credits} Credits
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {GRADES.map(grade => {
                const isSelected = sub.expectedGrade === grade;
                return (
                  <button
                    key={grade}
                    onClick={() => handleGradeChange(idx, grade)}
                    style={{
                      flex: 1,
                      minWidth: '36px',
                      padding: '0.5rem 0.25rem',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                      color: isSelected ? 'white' : 'var(--text-muted)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

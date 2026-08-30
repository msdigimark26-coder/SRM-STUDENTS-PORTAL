import React from 'react';
import type { AcademicSubject, SRMGrade } from '@srm/shared';
import { Trash2, Plus } from 'lucide-react';
import { SRM_GRADING_SCALE, calculateSGPA } from '../../utils/academicUtils';

interface SGPACalculatorProps {
  subjects: AcademicSubject[];
  onSubjectsChange: (subjects: AcademicSubject[]) => void;
}

export const SGPACalculator: React.FC<SGPACalculatorProps> = ({ subjects, onSubjectsChange }) => {
  const { sgpa, totalCredits, qualityPoints } = calculateSGPA(subjects, true);
  
  const handleGradeChange = (index: number, grade: SRMGrade) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], expectedGrade: grade };
    onSubjectsChange(newSubjects);
  };

  const handleUpdateSubject = (index: number, field: keyof AcademicSubject, value: any) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    onSubjectsChange(newSubjects);
  };

  const addSubject = () => {
    const newSubject: AcademicSubject = {
      code: `SUB${subjects.length + 1}`,
      name: ``,
      credits: 3,
      expectedGrade: 'None'
    };
    onSubjectsChange([...subjects, newSubject]);
  };

  const removeSubject = (index: number) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    onSubjectsChange(newSubjects);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Current Semester SGPA</h3>
        <button onClick={addSubject} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <Plus size={14} /> Add Subject
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected SGPA</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6' }}>{sgpa > 0 ? sgpa.toFixed(2) : '0.00'}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border-color)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Credits</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{totalCredits}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border-color)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Points</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{qualityPoints}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Code</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Subject</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Credits</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Grade</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No subjects added for this semester.</td>
              </tr>
            )}
            {subjects.map((sub, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  <input 
                    type="text" 
                    value={sub.code}
                    onChange={(e) => handleUpdateSubject(idx, 'code', e.target.value)}
                    style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  <input 
                    type="text" 
                    value={sub.name}
                    placeholder="Optional"
                    onChange={(e) => handleUpdateSubject(idx, 'name', e.target.value)}
                    style={{ width: '100%', minWidth: '120px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <input 
                    type="number" 
                    min={0}
                    value={sub.credits}
                    onChange={(e) => handleUpdateSubject(idx, 'credits', parseFloat(e.target.value) || 0)}
                    style={{ width: '60px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select 
                    value={sub.expectedGrade || 'None'} 
                    onChange={(e) => handleGradeChange(idx, e.target.value as SRMGrade)}
                    style={{ width: '100px', padding: '0.4rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <option value="None">Select...</option>
                    {Object.entries(SRM_GRADING_SCALE).filter(([g]) => g !== 'None').map(([grade, point]) => (
                      <option key={grade} value={grade}>{grade} ({point})</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                  <button onClick={() => removeSubject(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import type { SemesterRecord } from '@srm/shared';
import { calculateCGPA } from '../../utils/academicUtils';
import { Trash2, Plus } from 'lucide-react';

interface CGPACalculatorProps {
  pastSemesters: SemesterRecord[];
  onSemestersChange: (semesters: SemesterRecord[]) => void;
}

export const CGPACalculator: React.FC<CGPACalculatorProps> = ({ pastSemesters, onSemestersChange }) => {
  const { cgpa, totalCredits } = calculateCGPA(pastSemesters);

  const addSemester = () => {
    const newSem = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Semester ${pastSemesters.length + 1}`,
      credits: 0,
      sgpa: 0
    };
    onSemestersChange([...pastSemesters, newSem]);
  };

  const removeSemester = (index: number) => {
    const newSems = [...pastSemesters];
    newSems.splice(index, 1);
    onSemestersChange(newSems);
  };

  const updateSemester = (index: number, field: keyof SemesterRecord, value: string | number) => {
    const newSems = [...pastSemesters];
    newSems[index] = { ...newSems[index], [field]: value };
    onSemestersChange(newSems);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Past Semesters (CGPA)</h3>
        <button onClick={addSemester} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <Plus size={14} /> Add Semester
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current CGPA</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{cgpa > 0 ? cgpa.toFixed(2) : '0.00'}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border-color)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Credits</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{totalCredits}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Semester</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Total Credits</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>SGPA</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pastSemesters.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No past semesters added.</td>
              </tr>
            )}
            {pastSemesters.map((sem, idx) => (
              <tr key={sem.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  <input 
                    type="text" 
                    value={sem.name}
                    onChange={(e) => updateSemester(idx, 'name', e.target.value)}
                    style={{ width: '120px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <input 
                    type="number" 
                    min={0}
                    value={sem.credits}
                    onChange={(e) => updateSemester(idx, 'credits', parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <input 
                    type="number" 
                    min={0} max={10} step={0.01}
                    value={sem.sgpa}
                    onChange={(e) => updateSemester(idx, 'sgpa', parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                  <button onClick={() => removeSemester(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}>
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

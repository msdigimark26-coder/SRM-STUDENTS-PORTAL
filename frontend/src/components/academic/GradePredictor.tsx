import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { calculateRequiredSGPA } from '../../utils/academicUtils';

interface GradePredictorProps {
  currentCGPA: number;
  completedCredits: number;
  currentSemesterCredits: number;
}

export const GradePredictor: React.FC<GradePredictorProps> = ({ currentCGPA, completedCredits, currentSemesterCredits }) => {
  const [targetCGPA, setTargetCGPA] = useState<number>(currentCGPA > 0 ? Number((currentCGPA + 0.1).toFixed(2)) : 8.0);

  const { requiredSGPA, possible } = calculateRequiredSGPA(currentCGPA, completedCredits, currentSemesterCredits, targetCGPA);

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Target size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>CGPA Target Predictor</h3>
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Find out exactly what SGPA you need this semester to reach your target CGPA.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Target CGPA</label>
          <input 
            type="number" 
            min={0} max={10} step={0.01}
            value={targetCGPA}
            onChange={(e) => setTargetCGPA(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-active)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 600 }}
          />
        </div>
      </div>

      <div style={{ 
        padding: '1.25rem', 
        borderRadius: '8px', 
        background: possible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
        border: `1px solid ${possible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {possible ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
              <TrendingUp size={18} /> Required SGPA this semester:
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
              {requiredSGPA.toFixed(2)}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Based on {completedCredits} completed credits and {currentSemesterCredits} current credits.
            </p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
              <AlertTriangle size={18} /> Target not achievable
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              Even with a perfect 10.0 SGPA this semester, the maximum possible CGPA you can reach is <strong>{(((currentCGPA * completedCredits) + (10 * currentSemesterCredits)) / (completedCredits + currentSemesterCredits)).toFixed(2)}</strong>.
            </p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Info size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        <div>
          This calculator uses the exact mathematical formula: <br/>
          <code>(Target_CGPA × Total_Credits) - (Current_CGPA × Completed_Credits) / Current_Semester_Credits</code>
        </div>
      </div>
    </div>
  );
};

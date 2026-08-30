import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface AttendanceRecoveryPlannerProps {
  studentData: NormalizedStudentData;
}

export const AttendanceRecoveryPlanner: React.FC<AttendanceRecoveryPlannerProps> = ({ studentData }) => {
  const engine = useMemo(() => new AttendanceEngine(), []);

  // Find subjects that are below 75%
  const subjectsBelowTarget = useMemo(() => {
    return studentData.attendance.filter(record => {
      if (record.conductedHours === 0) return false;
      const pct = (record.attendedHours / record.conductedHours) * 100;
      return pct < 75;
    });
  }, [studentData]);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  
  // Selected number of classes the user checks to attend
  const [checkedClassesCount, setCheckedClassesCount] = useState<number>(0);

  useEffect(() => {
    if (subjectsBelowTarget.length > 0 && !selectedSubjectCode) {
      setSelectedSubjectCode(subjectsBelowTarget[0].subjectCode);
    }
  }, [subjectsBelowTarget, selectedSubjectCode]);

  // Reset checked classes when changing subject
  useEffect(() => {
    setCheckedClassesCount(0);
  }, [selectedSubjectCode]);

  const selectedRecord = useMemo(() => {
    return studentData.attendance.find(a => a.subjectCode === selectedSubjectCode);
  }, [studentData.attendance, selectedSubjectCode]);

  if (subjectsBelowTarget.length === 0) {
    return null; // All subjects are safe! No need for a recovery planner.
  }

  if (!selectedRecord) return null;

  const currentPercentage = selectedRecord.conductedHours > 0 
    ? (selectedRecord.attendedHours / selectedRecord.conductedHours) * 100 
    : 0;

  const recoveryClassesRequired = engine.calculateRecoveryHours(selectedRecord.attendedHours, selectedRecord.conductedHours) || 0;

  // Render the checkboxes up to recoveryClassesRequired + 1 (just to show pushing past 75 if they want)
  // Actually, let's just render the exact amount needed to hit the target
  const renderCheckboxesCount = Math.max(1, recoveryClassesRequired);

  const projectedAttended = selectedRecord.attendedHours + checkedClassesCount;
  const projectedConducted = selectedRecord.conductedHours + checkedClassesCount;
  const projectedPercentage = (projectedAttended / projectedConducted) * 100;

  const isRecovered = projectedPercentage >= 75;

  return (
    <div className="card" style={{ border: '2px solid var(--border-color)', backgroundColor: 'transparent' }}>
      <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <TrendingUp size={16} /> ATTENDANCE RECOVERY PLANNER
      </h4>

      <div style={{ marginBottom: '1.5rem' }}>
        <select 
          value={selectedSubjectCode} 
          onChange={e => setSelectedSubjectCode(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-color)', fontSize: '1rem', fontWeight: 'bold' }}
        >
          {subjectsBelowTarget.map(sub => {
            const pct = (sub.attendedHours / sub.conductedHours) * 100;
            const subjectName = studentData.subjects.find(s => s.code === sub.subjectCode)?.name || sub.subjectCode;
            return (
              <option key={sub.subjectCode} value={sub.subjectCode}>
                {subjectName} ({pct.toFixed(1)}%)
              </option>
            );
          })}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current</div>
          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{currentPercentage.toFixed(1)}% 🔴</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Target</div>
          <div style={{ fontWeight: 'bold' }}>75%</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recovery</div>
          <div style={{ fontWeight: 'bold' }}>{recoveryClassesRequired} classes</div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>If you attend:</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Array.from({ length: renderCheckboxesCount }).map((_, i) => {
            const count = i + 1;
            const tempAtt = selectedRecord.attendedHours + count;
            const tempCond = selectedRecord.conductedHours + count;
            const tempPct = (tempAtt / tempCond) * 100;
            const hitTarget = tempPct >= 75;

            return (
              <label 
                key={count} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: checkedClassesCount === count ? 'var(--bg-card-hover)' : 'transparent',
                  border: '1px solid',
                  borderColor: checkedClassesCount === count ? 'var(--border-color)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="radio" 
                    name="recoveryClasses"
                    checked={checkedClassesCount === count}
                    onChange={() => setCheckedClassesCount(count)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span>Next {count} {count === 1 ? 'class' : 'classes'}</span>
                </div>
                <div style={{ fontWeight: 500, color: hitTarget ? '#22c55e' : 'var(--text-color)' }}>
                  → {tempPct.toFixed(1)}% {hitTarget && '🟢'}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Recommendation:</div>
        {checkedClassesCount === 0 && (
          <div style={{ fontWeight: 500 }}>Select classes to see your recovery projection.</div>
        )}
        {checkedClassesCount > 0 && !isRecovered && (
          <div style={{ fontWeight: 500, color: '#f97316' }}>
            Attending {checkedClassesCount} {checkedClassesCount === 1 ? 'class' : 'classes'} will bring you to {projectedPercentage.toFixed(1)}%, but you still need {recoveryClassesRequired - checkedClassesCount} more to reach 75%.
          </div>
        )}
        {checkedClassesCount > 0 && isRecovered && (
          <div style={{ fontWeight: 500, color: '#22c55e' }}>
            Excellent! Attending the next {checkedClassesCount} {studentData.subjects.find(s => s.code === selectedRecord.subjectCode)?.name || selectedRecord.subjectCode} {checkedClassesCount === 1 ? 'class' : 'classes'} without missing will perfectly recover your attendance to {projectedPercentage.toFixed(1)}%.
          </div>
        )}
      </div>
    </div>
  );
};

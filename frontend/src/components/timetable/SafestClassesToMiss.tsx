import React from 'react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface SafestClassesToMissProps {
  studentData: NormalizedStudentData;
}

export const SafestClassesToMiss: React.FC<SafestClassesToMissProps> = ({ studentData }) => {
  const engine = new AttendanceEngine();
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);

  const rankedSubjects = results
    .map(sub => {
      const percentage = sub.conductedHours > 0 ? (sub.attendedHours / sub.conductedHours) * 100 : 0;
      const safeMisses = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
      
      let riskLevel = 'SAFE';
      if (percentage < 75) riskLevel = 'HIGH PRIORITY';
      else if (safeMisses === 0) riskLevel = 'WATCH';
      else if (safeMisses > 2) riskLevel = 'LOW RISK';

      return {
        ...sub,
        percentage,
        safeMisses,
        riskLevel
      };
    })
    .filter(sub => sub.conductedHours > 0)
    .sort((a, b) => {
      // Sort by safe misses descending, then percentage descending
      if (b.safeMisses !== a.safeMisses) {
        return b.safeMisses - a.safeMisses;
      }
      return b.percentage - a.percentage;
    });

  if (rankedSubjects.length === 0) return null;

  return (
    <div className="card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
        <span>⭐</span> SAFEST CLASSES TO MISS
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {rankedSubjects.map((sub, idx) => {
          const icon = sub.riskLevel === 'LOW RISK' || sub.riskLevel === 'SAFE' ? '🟢' : sub.riskLevel === 'WATCH' ? '🟠' : '🔴';
          
          return (
            <div key={sub.subjectCode} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem', borderBottom: idx < rankedSubjects.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-muted)', width: '20px' }}>
                {idx + 1}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{sub.subjectName}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{sub.percentage.toFixed(1)}%</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Safe to miss: <strong>{sub.safeMisses}</strong></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <span>{icon}</span> {sub.riskLevel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

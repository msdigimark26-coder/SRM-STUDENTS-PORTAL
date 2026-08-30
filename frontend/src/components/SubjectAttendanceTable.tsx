import React from 'react';
import type { SubjectAttendanceResult } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';

interface SubjectAttendanceTableProps {
  subjects: SubjectAttendanceResult[];
  engine: AttendanceEngine;
}

export const SubjectAttendanceTable: React.FC<SubjectAttendanceTableProps> = ({ subjects, engine }) => {
  if (subjects.length === 0) {
    return <div className="card empty-subjects">No subjects available.</div>;
  }

  return (
    <div className="card table-container" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', border: 'none', padding: 0 }}>Subject Attendance Health</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Real-time status, safe leave limits, recovery goals, and hour-by-hour impact simulations.</p>
      </div>
      
      <div className="table-responsive">
        <table className="subject-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <th>Subject & Code</th>
              <th style={{ textAlign: 'center' }}>Credits</th>
              <th style={{ textAlign: 'center' }}>Attended / Conducted</th>
              <th style={{ textAlign: 'center' }}>Current %</th>
              <th style={{ textAlign: 'center' }}>Safe Miss Limit</th>
              <th style={{ textAlign: 'center' }}>+1 / -1 Hour Impact</th>
              <th style={{ textAlign: 'center' }}>Priority</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(sub => {
              if (sub.conductedHours === 0) return null;

              const pct = (sub.attendedHours / sub.conductedHours) * 100;
              const safeMisses = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
              
              const plusOne = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 1, 0);
              const minusOne = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 0, 1);

              let priority = 'LOW';
              let priorityColor = 'var(--status-safe)';
              let priorityBg = 'rgba(16,185,129,0.1)';
              
              if (pct < 75 || safeMisses === 0) {
                priority = 'HIGH';
                priorityColor = 'var(--status-risk)';
                priorityBg = 'rgba(239,68,68,0.1)';
              } else if (pct < 80 || safeMisses <= 2) {
                priority = 'MEDIUM';
                priorityColor = 'var(--status-watch)';
                priorityBg = 'rgba(245,158,11,0.1)';
              }

              return (
                <tr key={sub.subjectCode}>
                  <td className="subject-name-cell" style={{ padding: '1.25rem 1rem' }}>
                    <span className="subject-code" style={{ fontSize: '0.95rem' }}>{sub.subjectName}</span>
                    <span className="subject-name" style={{ color: 'var(--text-muted)' }}>{sub.subjectCode}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{sub.credits} C</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {sub.attendedHours} <span style={{ color: 'var(--text-muted)' }}>/ {sub.conductedHours}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: pct >= 75 ? 'var(--status-safe)' : 'var(--status-risk)' }}>
                    {pct.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: safeMisses > 0 ? 'var(--status-safe)' : 'var(--status-watch)', fontWeight: 600 }}>
                      {safeMisses} class{safeMisses !== 1 ? 'es' : ''}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--status-safe)' }}>+{plusOne?.toFixed(2)}%</span>
                        <span style={{ color: 'var(--status-risk)' }}>{minusOne !== null ? `-${(pct - minusOne).toFixed(2)}` : ''}%</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ border: `1px solid ${priorityColor}`, color: priorityColor, background: priorityBg, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ border: `1px solid var(--status-${sub.healthStatus.toLowerCase()})`, color: `var(--status-${sub.healthStatus.toLowerCase()})`, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {sub.healthStatus === 'SAFE' && '✓'}
                      {(sub.healthStatus === 'WATCH' || sub.healthStatus === 'AT_RISK') && '!'}
                      {sub.healthStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

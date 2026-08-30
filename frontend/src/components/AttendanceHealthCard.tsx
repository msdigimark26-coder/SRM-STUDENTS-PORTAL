import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { NormalizedStudentData, SubjectAttendanceResult } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';

interface AttendanceHealthCardProps {
  studentData: NormalizedStudentData;
  results: SubjectAttendanceResult[];
  engine: AttendanceEngine;
}

export const AttendanceHealthCard: React.FC<AttendanceHealthCardProps> = ({ results }) => {
  const totalAttended = results.reduce((sum, r) => sum + r.attendedHours, 0);
  const totalConducted = results.reduce((sum, r) => sum + r.conductedHours, 0);
  const overallPercentage = totalConducted === 0 ? 0 : (totalAttended / totalConducted) * 100;
  
  const targetPercentage = 75;
  const buffer = overallPercentage - targetPercentage;
  
  const activeSubjects = results.filter(r => r.conductedHours > 0);
  
  let safeCount = 0;
  let watchCount = 0;
  let riskCount = 0;

  activeSubjects.forEach(r => {
    const pct = (r.attendedHours / r.conductedHours) * 100;
    if (pct >= 80) safeCount++;
    else if (pct >= 75) watchCount++;
    else riskCount++;
  });

  const overallHealthStatus = riskCount > 0 ? 'WATCH' : overallPercentage >= 80 ? 'SAFE' : overallPercentage >= 75 ? 'WATCH' : 'AT_RISK';
  
  // Progress bar logic
  const progressWidth = Math.min(100, (overallPercentage / targetPercentage) * 75); 
  // If target is 75%, visually 75% fills about 3/4 of the bar. 

  // SVG Circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Left Panel - Circular Gauge */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--primary)" strokeWidth="12" 
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} 
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{overallPercentage.toFixed(1)}%</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Overall</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Overall Attendance Health</h2>
            <span className={`status-badge status-${overallHealthStatus.toLowerCase()}`}>{overallHealthStatus.replace('_', ' ')}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
            Attended <strong>{totalAttended}</strong> of <strong>{totalConducted}</strong> total conducted hours across <strong>{activeSubjects.length}</strong> registered subjects.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: buffer >= 0 ? 'var(--status-safe)' : 'var(--status-risk)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {buffer >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {buffer >= 0 ? '+' : ''}{buffer.toFixed(1)}% Buffer
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Minimum Target: {targetPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Progress & Pills */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Target Threshold Progress</span>
            <span>{overallPercentage.toFixed(1)}% / {targetPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progressWidth}%`, background: 'linear-gradient(90deg, var(--primary), var(--status-safe))', borderRadius: '4px' }}></div>
            {/* Target marker */}
            <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.8)' }}></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'var(--status-safe-bg)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: 'var(--status-safe)', fontSize: '1.25rem', fontWeight: 700 }}>{safeCount}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>SAFE (≥80%)</span>
          </div>
          <div style={{ background: 'var(--status-watch-bg)', border: '1px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: 'var(--status-watch)', fontSize: '1.25rem', fontWeight: 700 }}>{watchCount}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>WATCH (75-80%)</span>
          </div>
          <div style={{ background: 'var(--status-risk-bg)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: 'var(--status-risk)', fontSize: '1.25rem', fontWeight: 700 }}>{riskCount}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>AT RISK (&lt;75%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

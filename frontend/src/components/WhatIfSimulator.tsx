import React, { useState } from 'react';
import type { NormalizedStudentData, SubjectAttendanceResult } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';

interface WhatIfSimulatorProps {
  studentData: NormalizedStudentData;
  results: SubjectAttendanceResult[];
  engine: AttendanceEngine;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ results }) => {
  const [simulations, setSimulations] = useState<Record<string, { attend: number, miss: number }>>({});

  const handleSimulate = (subjectCode: string, type: 'attend' | 'miss', delta: number) => {
    setSimulations(prev => {
      const current = prev[subjectCode] || { attend: 0, miss: 0 };
      const next = { ...current };
      next[type] = Math.max(0, current[type] + delta);
      return { ...prev, [subjectCode]: next };
    });
  };

  const resetAll = () => setSimulations({});

  let currentTotalAttended = 0;
  let currentTotalConducted = 0;
  let projectedTotalAttended = 0;
  let projectedTotalConducted = 0;

  const subjectsRender = results.map(sub => {
    if (sub.conductedHours === 0) return null;
    
    currentTotalAttended += sub.attendedHours;
    currentTotalConducted += sub.conductedHours;
    
    const sim = simulations[sub.subjectCode] || { attend: 0, miss: 0 };
    const pAttended = sub.attendedHours + sim.attend;
    const pConducted = sub.conductedHours + sim.attend + sim.miss;
    
    projectedTotalAttended += pAttended;
    projectedTotalConducted += pConducted;

    const currentPct = (sub.attendedHours / sub.conductedHours) * 100;
    const projectedPct = (pAttended / pConducted) * 100;
    
    let status = 'SAFE';
    let statusColor = 'var(--status-safe)';
    
    if (projectedPct < 75) {
      status = 'AT RISK';
      statusColor = 'var(--status-risk)';
    } else if (projectedPct < 80) {
      status = 'WATCH';
      statusColor = 'var(--status-watch)';
    }

    return (
      <div key={sub.subjectCode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{sub.subjectName} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>({sub.subjectCode})</span></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Before: <strong style={{ color: currentPct >= 75 ? 'var(--status-safe)' : 'var(--status-risk)' }}>{currentPct.toFixed(1)}%</strong> → 
            Projected: <strong style={{ color: projectedPct >= 75 ? 'var(--status-safe)' : 'var(--status-risk)' }}>{projectedPct.toFixed(1)}%</strong>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--status-safe)' }}>Attend:</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <button onClick={() => handleSimulate(sub.subjectCode, 'attend', -1)} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>-</button>
              <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{sim.attend}</span>
              <button onClick={() => handleSimulate(sub.subjectCode, 'attend', 1)} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}>+</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--status-risk)' }}>Miss:</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <button onClick={() => handleSimulate(sub.subjectCode, 'miss', -1)} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}>-</button>
              <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{sim.miss}</span>
              <button onClick={() => handleSimulate(sub.subjectCode, 'miss', 1)} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}>+</button>
            </div>
          </div>

          <span style={{ border: `1px solid ${statusColor}`, color: statusColor, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, width: '80px', textAlign: 'center' }}>
            {status}
          </span>
        </div>
      </div>
    );
  });

  const currentOverall = currentTotalConducted > 0 ? (currentTotalAttended / currentTotalConducted) * 100 : 0;
  const projectedOverall = projectedTotalConducted > 0 ? (projectedTotalAttended / projectedTotalConducted) * 100 : 0;
  const delta = projectedOverall - currentOverall;

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Interactive "What If?" Attendance Simulator</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Simulate attending or missing hypothetical future classes across multiple subjects.</p>
        </div>
        <button className="secondary-btn" onClick={resetAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ↻ Reset All Simulations
        </button>
      </div>

      <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Overall</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{currentOverall.toFixed(1)}%</div>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>→</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Projected Overall</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{projectedOverall.toFixed(1)}%</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Projected Delta</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: delta >= 0 ? 'var(--status-safe)' : 'var(--status-risk)' }}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {subjectsRender}
      </div>
    </div>
  );
};

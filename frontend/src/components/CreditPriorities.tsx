import React from 'react';
import { Zap } from 'lucide-react';
import type { NormalizedStudentData, SubjectAttendanceResult } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';

interface CreditPrioritiesProps {
  studentData: NormalizedStudentData;
  results: SubjectAttendanceResult[];
  engine: AttendanceEngine;
}

export const CreditPriorities: React.FC<CreditPrioritiesProps> = ({ results, engine }) => {
  const cards = results.filter(r => r.conductedHours > 0).map(sub => {
    const pct = (sub.attendedHours / sub.conductedHours) * 100;
    const safeMisses = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
    const recoveryHours = engine.calculateRecoveryHours(sub.attendedHours, sub.conductedHours);
    
    let priority = 'LOW';
    let priorityColor = 'var(--status-safe)';
    let priorityBg = 'rgba(16,185,129,0.1)';
    let description = '';

    if (pct < 75) {
      priority = 'HIGH';
      priorityColor = 'var(--status-risk)';
      priorityBg = 'rgba(239,68,68,0.1)';
      description = `[HIGH PRIORITY] Currently at ${pct.toFixed(1)}% (below 75%). Requires ${recoveryHours} consecutive attended class${recoveryHours !== 1 ? 'es' : ''} to recover.`;
    } else if (pct < 80 || safeMisses === 0) {
      priority = 'HIGH';
      priorityColor = 'var(--status-risk)';
      priorityBg = 'rgba(239,68,68,0.1)';
      description = `[HIGH PRIORITY] Very close to minimum requirement (${pct.toFixed(1)}%). ${safeMisses} safe absence${safeMisses !== 1 ? 's' : ''} left. (${sub.credits} Credits).`;
    } else if (pct < 85 || safeMisses <= 2) {
      priority = 'MEDIUM';
      priorityColor = 'var(--status-watch)';
      priorityBg = 'rgba(245,158,11,0.1)';
      description = `[MEDIUM PRIORITY] Safe at ${pct.toFixed(1)}%, but high credit course (${sub.credits} Credits) requires steady attendance to maintain buffer.`;
    } else {
      priority = 'LOW';
      priorityColor = 'var(--status-safe)';
      priorityBg = 'rgba(16,185,129,0.1)';
      description = `[LOW PRIORITY] Comfortable attendance buffer at ${pct.toFixed(1)}% with ${safeMisses} safe missed class${safeMisses !== 1 ? 'es' : ''} available.`;
    }

    // Weight for sorting: HIGH > MEDIUM > LOW, then by credit
    const weight = priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1;

    return { ...sub, pct, safeMisses, priority, priorityColor, priorityBg, description, weight };
  });

  // Sort by priority level descending, then credits descending
  cards.sort((a, b) => {
    if (a.weight !== b.weight) return b.weight - a.weight;
    return b.credits - a.credits;
  });

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Zap size={20} color="var(--status-watch)" /> Credit-Aware Priority Recommendations
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Combines subject credit weight, proximity to 75%, and recovery difficulty to recommend focus areas.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {cards.map(card => (
          <div key={card.subjectCode} style={{ border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{card.subjectName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{card.subjectCode} • {card.credits} Credits</div>
              </div>
              <span style={{ border: `1px solid ${card.priorityColor}`, color: card.priorityColor, background: card.priorityBg, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                {card.priority}
              </span>
            </div>
            
            <div style={{ padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', minHeight: '80px' }}>
              {card.description}
            </div>
            
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div>Attendance: <strong style={{ color: card.pct >= 75 ? 'var(--status-safe)' : 'var(--status-risk)' }}>{card.pct.toFixed(1)}%</strong></div>
              <div>Safe Miss: <strong style={{ color: card.safeMisses > 0 ? 'var(--status-safe)' : 'var(--status-risk)' }}>{card.safeMisses} classes</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

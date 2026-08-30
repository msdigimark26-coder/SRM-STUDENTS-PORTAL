import React, { useState, useMemo } from 'react';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';
import { simulateAttendance, determineHealthStatus } from '@srm/shared';

interface SelectivePeriodPlannerProps {
  studentData: NormalizedStudentData;
  todaysClasses: TimetablePeriod[];
}

export const SelectivePeriodPlanner: React.FC<SelectivePeriodPlannerProps> = ({ studentData, todaysClasses }) => {
  const [selectedPeriods, setSelectedPeriods] = useState<TimetablePeriod[]>([]);

  const togglePeriod = (period: TimetablePeriod) => {
    setSelectedPeriods(prev => {
      const exists = prev.find(p => p.period === period.period && p.startTime === period.startTime);
      if (exists) {
        return prev.filter(p => p !== exists);
      }
      return [...prev, period];
    });
  };

  const subjectImpacts = useMemo(() => {
    if (selectedPeriods.length === 0) return [];

    const missCount: Record<string, number> = {};
    selectedPeriods.forEach(p => {
      missCount[p.subjectCode] = (missCount[p.subjectCode] || 0) + 1;
    });

    const impacts = Object.keys(missCount).map(subjectCode => {
      const record = studentData.attendance.find(a => a.subjectCode === subjectCode);
      const subject = studentData.subjects.find(s => s.code === subjectCode);
      if (!record || !subject) return null;

      const missed = missCount[subjectCode];
      const current = { attended: record.attendedHours, conducted: record.conductedHours };
      const currentPercentage = current.conducted > 0 ? (current.attended / current.conducted) * 100 : 0;
      const ifMissed = simulateAttendance({ current, changes: { miss: missed } });

      return {
        subjectCode,
        subjectName: subject.name,
        currentPercentage,
        projectedPercentage: ifMissed.percentage,
        status: ifMissed.status
      };
    }).filter(i => i !== null) as any[];

    return impacts;
  }, [selectedPeriods, studentData]);

  const overallImpact = useMemo(() => {
    if (selectedPeriods.length === 0) return null;

    let totalAttended = 0;
    let totalConducted = 0;

    studentData.attendance.forEach(record => {
      totalAttended += record.attendedHours;
      totalConducted += record.conductedHours;
    });

    const currentPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const projectedConducted = totalConducted + selectedPeriods.length;
    const projectedPercentage = projectedConducted > 0 ? (totalAttended / projectedConducted) * 100 : 0;
    
    const status = determineHealthStatus(projectedPercentage, 75, 5, 5);

    return {
      currentPercentage,
      projectedPercentage,
      status
    };
  }, [selectedPeriods, studentData]);

  if (todaysClasses.length === 0) {
    return null; // Don't show planner if there are no classes today
  }

  return (
    <div className="card" style={{ border: '2px solid var(--border-color)', backgroundColor: 'transparent' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span>🎯</span> SELECTIVE PERIOD PLANNER
      </h3>

      <div style={{ backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>SELECT CLASSES TO MISS</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todaysClasses.map((cls, idx) => {
            const isSelected = !!selectedPeriods.find(p => p.period === cls.period && p.startTime === cls.startTime);
            return (
              <label 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => togglePeriod(cls)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{cls.startTime}</span>
                <span style={{ fontWeight: 500, color: isSelected ? 'var(--text-color)' : 'var(--text-muted)' }}>{cls.subjectName}</span>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Selected: <strong>{selectedPeriods.length}</strong> classes
        </div>
      </div>

      {overallImpact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>CURRENT OVERALL</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{overallImpact.currentPercentage.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>PROJECTED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{overallImpact.projectedPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '0.5rem' }}>STATUS</span>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: '4px', 
              backgroundColor: overallImpact.status === 'BELOW_TARGET' ? '#ef4444' : overallImpact.status === 'AT_RISK' ? '#f97316' : '#22c55e',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}>
              {overallImpact.status === 'BELOW_TARGET' ? '🔴 DANGER' : overallImpact.status === 'AT_RISK' ? '🟠 WATCH' : '🟢 SAFE'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {subjectImpacts.map((imp, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 500 }}>{imp.subjectName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {imp.currentPercentage.toFixed(1)}% → {imp.projectedPercentage.toFixed(1)}% 
                  <span style={{ marginLeft: '0.5rem' }}>
                    {imp.status === 'BELOW_TARGET' ? '🔴' : imp.status === 'AT_RISK' ? '🟠' : '🟢'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

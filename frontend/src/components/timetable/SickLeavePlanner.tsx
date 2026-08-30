import React, { useState, useMemo } from 'react';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';
import { getClassesForDays } from '../../utils/timetableUtils';
import { determineHealthStatus } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface SickLeavePlannerProps {
  studentData: NormalizedStudentData;
}

type LeaveOption = 'Today' | 'Tomorrow' | '2 Days' | '3 Days' | 'Custom Range';

export const SickLeavePlanner: React.FC<SickLeavePlannerProps> = ({ studentData }) => {
  const [selectedOption, setSelectedOption] = useState<LeaveOption>('Today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [appliedCustomDates, setAppliedCustomDates] = useState<{start: string, end: string} | null>(null);

  const datesToMiss = useMemo(() => {
    const dates: Date[] = [];
    
    if (selectedOption === 'Custom Range') {
      if (!appliedCustomDates) return [];
      
      const start = new Date(appliedCustomDates.start);
      const end = new Date(appliedCustomDates.end);
      
      if (start > end) return [];
      
      // Limit to max 30 days
      let current = new Date(start);
      let count = 0;
      while (current <= end && count < 30) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
        count++;
      }
      return dates;
    }

    const today = new Date();
    let count = 1;
    let startOffset = 0;
    
    if (selectedOption === 'Tomorrow') {
      startOffset = 1;
    } else if (selectedOption === '2 Days') {
      count = 2;
    } else if (selectedOption === '3 Days') {
      count = 3;
    }

    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + startOffset + i);
      dates.push(d);
    }
    return dates;
  }, [selectedOption, appliedCustomDates]);

  // Group periods by specific Date to show day-by-day breakdown
  const dailyBreakdown = useMemo(() => {
    const breakdown: { date: Date; dateString: string; dayName: string; periods: TimetablePeriod[] }[] = [];
    
    datesToMiss.forEach(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      // Use getClassesForDays for a single day to get that day's periods
      const periods = getClassesForDays(studentData.timetable, [dayName]);
      if (periods.length > 0) {
        breakdown.push({
          date,
          dateString: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          dayName,
          periods
        });
      }
    });

    return breakdown;
  }, [datesToMiss, studentData.timetable]);

  const totalClassesAffected = useMemo(() => {
    return dailyBreakdown.reduce((sum, day) => sum + day.periods.length, 0);
  }, [dailyBreakdown]);

  const overallImpact = useMemo(() => {
    if (totalClassesAffected === 0) return null;

    let totalAttended = 0;
    let totalConducted = 0;

    studentData.attendance.forEach(record => {
      totalAttended += record.attendedHours;
      totalConducted += record.conductedHours;
    });

    const currentPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const projectedConducted = totalConducted + totalClassesAffected;
    const projectedPercentage = projectedConducted > 0 ? (totalAttended / projectedConducted) * 100 : 0;
    
    const engine = new AttendanceEngine();
    const status = determineHealthStatus(projectedPercentage, 75, 5, 5);
    
    // Count subjects below 75%
    const missCountBySubject: Record<string, number> = {};
    dailyBreakdown.forEach(day => {
      day.periods.forEach(p => {
        missCountBySubject[p.subjectCode] = (missCountBySubject[p.subjectCode] || 0) + 1;
      });
    });

    let subjectsBelow75 = 0;
    studentData.attendance.forEach(record => {
      const misses = missCountBySubject[record.subjectCode] || 0;
      if (misses > 0) {
        const p = ((record.attendedHours) / (record.conductedHours + misses)) * 100;
        if (p < 75) subjectsBelow75++;
      } else {
        if ((record.attendedHours / record.conductedHours) * 100 < 75) subjectsBelow75++;
      }
    });
    
    let recoveryHours = 0;
    if (projectedPercentage < 75) {
      recoveryHours = engine.calculateRecoveryHours(totalAttended, projectedConducted) || 0;
    }

    return {
      currentPercentage,
      projectedPercentage,
      status,
      subjectsBelow75,
      recoveryHours,
      missCountBySubject
    };
  }, [studentData, dailyBreakdown, totalClassesAffected]);

  const handleCalculateImpact = () => {
    if (!customStartDate || !customEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    const s = new Date(customStartDate);
    const e = new Date(customEndDate);
    if (s > e) {
      alert("End date cannot be before start date.");
      return;
    }
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 30) {
      alert("Please select a range of 30 days or less.");
      return;
    }
    setAppliedCustomDates({ start: customStartDate, end: customEndDate });
  };

  if (!studentData.timetable || !studentData.timetable.sessions || studentData.timetable.sessions.length === 0) {
    return (
      <div className="card" style={{ opacity: 0.7 }}>
        <h3>🤒 Sick Leave Planner</h3>
        <p style={{ color: 'var(--text-muted)' }}>Please import your timetable to simulate sick leaves.</p>
      </div>
    );
  }

  const options: LeaveOption[] = ['Today', 'Tomorrow', '2 Days', '3 Days', 'Custom Range'];

  return (
    <div className="card" style={{ border: '2px solid var(--border-color)', backgroundColor: 'transparent' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span>🤒</span> SICK LEAVE PLANNER
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>Absence period</label>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {options.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="leaveOption" 
                value={opt} 
                checked={selectedOption === opt}
                onChange={() => {
                  setSelectedOption(opt);
                  setAppliedCustomDates(null);
                }}
                style={{ cursor: 'pointer' }}
              />
              {opt}
            </label>
          ))}
        </div>
        
        {selectedOption === 'Custom Range' && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>From:</span>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-color)' }} 
              />
              <span style={{ color: 'var(--text-muted)' }}>To:</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-color)' }} 
              />
            </div>
            <button 
              onClick={handleCalculateImpact}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: 'none', background: 'var(--text-color)', color: 'var(--bg-card)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Calculate Impact
            </button>
          </div>
        )}
      </div>

      {(selectedOption !== 'Custom Range' || appliedCustomDates) && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Affected classes: <strong>{totalClassesAffected}</strong>
          </p>

          {dailyBreakdown.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {dailyBreakdown.map((day, idx) => {
                // Aggregate subject counts for this day
                const counts: Record<string, { count: number, name: string }> = {};
                day.periods.forEach(p => {
                  if (!counts[p.subjectCode]) counts[p.subjectCode] = { count: 0, name: p.subjectName };
                  counts[p.subjectCode].count += 1;
                });

                const engine = new AttendanceEngine();

                return (
                  <div key={idx}>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      {day.dateString}
                    </div>
                    {Object.entries(counts).map(([subCode, sub], sIdx) => {
                      const record = studentData.attendance.find(a => a.subjectCode === subCode);
                      let currentPct = 0;
                      let projectedPct = 0;
                      if (record && record.conductedHours > 0) {
                        currentPct = engine.calculateCurrent(record.attendedHours, record.conductedHours) || 0;
                        projectedPct = engine.calculateProjected(record.attendedHours, record.conductedHours, 0, sub.count) || 0;
                      }

                      const dotColor = projectedPct < 75 ? '#ef4444' : projectedPct < 80 ? '#f97316' : '#22c55e';

                      return (
                        <div key={sIdx} style={{ paddingLeft: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{sub.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subCode}</div>
                            {record && record.conductedHours > 0 && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                {currentPct.toFixed(1)}% → <strong style={{ color: dotColor }}>{projectedPct.toFixed(1)}%</strong>
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 500 }}>× {sub.count}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>class{sub.count > 1 ? 'es' : ''}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {totalClassesAffected === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '2rem' }}>
              No classes scheduled during this period.
            </p>
          )}

          {overallImpact && (
            <>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '1.5rem 0' }} />

              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>CUMULATIVE IMPACT OF SELECTED LEAVE PERIOD</p>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {overallImpact.currentPercentage.toFixed(1)}% → {overallImpact.projectedPercentage.toFixed(1)}% 
                  <span style={{ fontSize: '1.25rem' }}>
                    {overallImpact.status === 'BELOW_TARGET' ? '🔴' : overallImpact.status === 'AT_RISK' ? '🟠' : '🟢'}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    Subjects below 75%: <strong style={{ color: 'var(--text-color)' }}>{overallImpact.subjectsBelow75}</strong>
                  </div>
                  {overallImpact.recoveryHours > 0 && (
                    <div>
                      Recovery required: <strong style={{ color: 'var(--text-color)' }}>{overallImpact.recoveryHours} hours</strong>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

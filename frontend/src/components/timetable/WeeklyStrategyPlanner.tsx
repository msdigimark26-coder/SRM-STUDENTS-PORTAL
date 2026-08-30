import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';
import { getClassesForDays } from '../../utils/timetableUtils';
export type PlanMode = 'leave' | 'bunk' | 'recover' | 'maximize' | null;

interface WeeklyStrategyPlannerProps {
  studentData: NormalizedStudentData;
  planMode: PlanMode;
  setPlanMode: (mode: PlanMode) => void;
}

export const WeeklyStrategyPlanner: React.FC<WeeklyStrategyPlannerProps> = ({ studentData, planMode, setPlanMode }) => {
  const overallCurrentPercentage = useMemo(() => {
    let totalAttended = 0;
    let totalConducted = 0;
    studentData.attendance.forEach(record => {
      totalAttended += record.attendedHours;
      totalConducted += record.conductedHours;
    });
    return totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
  }, [studentData]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const weeklyEvaluation = useMemo(() => {
    if (!studentData.timetable || !studentData.timetable.sessions) return null;

    let totalAttended = 0;
    let totalConducted = 0;
    studentData.attendance.forEach(record => {
      totalAttended += record.attendedHours;
      totalConducted += record.conductedHours;
    });

    const evalByDay = daysOfWeek.map(dayName => {
      const periods = getClassesForDays(studentData.timetable, [dayName]);
      if (periods.length === 0) return { dayName, classes: 0, status: 'NO_CLASS', impact: 0, subjectsBelowTarget: 0, periods: [] };

      const missCountBySubject: Record<string, number> = {};
      periods.forEach(p => {
        missCountBySubject[p.subjectCode] = (missCountBySubject[p.subjectCode] || 0) + 1;
      });

      let subjectsBelowTarget = 0;
      studentData.attendance.forEach(record => {
        const missed = missCountBySubject[record.subjectCode] || 0;
        if (missed > 0) {
          const p = (record.attendedHours / (record.conductedHours + missed)) * 100;
          if (p < 75) subjectsBelowTarget++;
        }
      });

      const projectedConducted = totalConducted + periods.length;
      const projectedPercentage = projectedConducted > 0 ? (totalAttended / projectedConducted) * 100 : 0;
      
      let status = 'SAFE'; // 🟢
      if (projectedPercentage < 75 || subjectsBelowTarget > 0) {
        status = 'HIGH_RISK'; // 🔴
      } else if (projectedPercentage < 76.5) { // Arbitrary buffer
        status = 'WARNING'; // 🟠 Be Careful
      }

      return {
        dayName,
        classes: periods.length,
        status,
        impact: overallCurrentPercentage - projectedPercentage,
        subjectsBelowTarget,
        periods
      };
    });

    return evalByDay;
  }, [studentData, overallCurrentPercentage]);

  const smartRecommendation = useMemo(() => {
    if (!weeklyEvaluation) return null;

    // Safest Day (lowest impact, must have classes, ideally Safe status)
    const validDays = weeklyEvaluation.filter(d => d.classes > 0);
    const sortedBySafety = [...validDays].sort((a, b) => a.impact - b.impact);
    const safestDay = sortedBySafety.length > 0 ? sortedBySafety[0] : null;

    // Avoid missing
    const subjectsToAvoid = studentData.attendance.filter(a => {
      if (a.conductedHours === 0) return false;
      return (a.attendedHours / a.conductedHours) * 100 < 75;
    });

    // Best recovery opportunity (day with highest concentration of subjectsToAvoid)
    let bestRecoveryDay: any = null;
    let maxRecoveryClasses = 0;

    validDays.forEach(day => {
      let recoveryClasses = 0;
      day.periods.forEach(p => {
        if (subjectsToAvoid.find(sub => sub.subjectCode === p.subjectCode)) {
          recoveryClasses++;
        }
      });
      if (recoveryClasses > maxRecoveryClasses) {
        maxRecoveryClasses = recoveryClasses;
        bestRecoveryDay = day;
      }
    });

    return {
      safestDay,
      subjectsToAvoid,
      bestRecoveryDay,
      maxRecoveryClasses
    };
  }, [weeklyEvaluation, studentData]);


  if (!studentData.timetable || !studentData.timetable.sessions || studentData.timetable.sessions.length === 0) {
    return (
      <div className="card" style={{ opacity: 0.7 }}>
        <h3><Calendar size={18} style={{ display: 'inline', marginRight: '0.5rem' }} /> WEEKLY ATTENDANCE STRATEGY</h3>
        <p style={{ color: 'var(--text-muted)' }}>Please import your timetable to use the weekly planner.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ border: '2px solid var(--primary-color)', backgroundColor: 'transparent', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={20} /> WEEKLY ATTENDANCE STRATEGY
          </h3>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Overall: <strong>{overallCurrentPercentage.toFixed(1)}%</strong> 
            {overallCurrentPercentage >= 75 ? <CheckCircle2 size={14} color="#10b981" /> : <AlertCircle size={14} color="#ef4444" />} • Target: <strong>75%</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {weeklyEvaluation?.map(day => {
          if (day.status === 'NO_CLASS') return null;

          const statusColor = day.status === 'SAFE' ? '#22c55e' : day.status === 'WARNING' ? '#f97316' : '#ef4444';
          const statusIcon = day.status === 'SAFE' ? '🟢' : day.status === 'WARNING' ? '🟠' : '🔴';
          const statusText = day.status === 'SAFE' ? 'Safe' : day.status === 'WARNING' ? 'Be Careful' : 'High Risk';

          return (
            <div key={day.dayName} style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderTop: `4px solid ${statusColor}` }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{day.dayName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{day.classes} classes</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <span>{statusIcon}</span> {statusText}
              </div>
            </div>
          );
        })}
      </div>

      {smartRecommendation && (
        <div style={{ backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            <span>⭐</span> SMART RECOMMENDATION
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            
            {/* Lowest projected impact absence */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Lowest projected impact:</div>
              {smartRecommendation.safestDay ? (
                <div style={{ fontWeight: 500 }}>
                  {smartRecommendation.safestDay.dayName} — {smartRecommendation.safestDay.classes} classes
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No low-impact days to miss.</div>
              )}
            </div>

            {/* Avoid missing */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Avoid missing:</div>
              {smartRecommendation.subjectsToAvoid.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {smartRecommendation.subjectsToAvoid.map(sub => {
                    const subName = studentData.subjects.find(s => s.code === sub.subjectCode)?.name || sub.subjectCode;
                    return (
                      <div key={sub.subjectCode} style={{ color: '#ef4444', fontWeight: 500, fontSize: '0.9rem' }}>
                        🔴 {subName}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: '#22c55e', fontWeight: 500 }}>All subjects are above 75%.</div>
              )}
            </div>

            {/* Best recovery opportunity */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Best recovery opportunity:</div>
              {smartRecommendation.bestRecoveryDay ? (
                <div>
                  <div style={{ fontWeight: 500 }}>{smartRecommendation.bestRecoveryDay.dayName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Attend all {smartRecommendation.bestRecoveryDay.classes} periods</div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No critical recovery needed.</div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Plan My Week Mode Selector */}
      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>What are you planning?</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { value: 'leave', label: 'I want to take leave / I may be sick' },
            { value: 'bunk', label: 'I need to bunk 1–2 periods' },
            { value: 'recover', label: 'I want to recover attendance' },
            { value: 'maximize', label: 'I want to maximize attendance' }
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', borderRadius: '8px', backgroundColor: planMode === opt.value ? 'var(--bg-card-hover)' : 'transparent', border: planMode === opt.value ? '1px solid var(--primary-color)' : '1px solid transparent', transition: 'all 0.2s ease' }}>
              <input 
                type="radio" 
                name="planMode"
                value={opt.value}
                checked={planMode === opt.value}
                onChange={() => setPlanMode(opt.value as PlanMode)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: planMode === opt.value ? 600 : 400, color: planMode === opt.value ? 'var(--text-color)' : 'var(--text-muted)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

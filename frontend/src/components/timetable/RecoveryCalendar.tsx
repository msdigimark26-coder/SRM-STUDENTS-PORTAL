import React from 'react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface RecoveryCalendarProps {
  studentData: NormalizedStudentData;
}

export const RecoveryCalendar: React.FC<RecoveryCalendarProps> = ({ studentData }) => {
  const engine = new AttendanceEngine();
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);

  const subjectsNeedingRecovery = results.filter(sub => {
    if (sub.conductedHours === 0) return false;
    const percentage = (sub.attendedHours / sub.conductedHours) * 100;
    return percentage < 75;
  });

  const getRecoveryPlan = (subjectCode: string, currentAttended: number, currentConducted: number) => {
    if (!studentData.timetable || !studentData.timetable.sessions) return null;

    const requiredClasses = engine.calculateRecoveryHours(currentAttended, currentConducted) || 0;
    if (requiredClasses === 0) return null;

    let foundClasses = 0;
    const recoveryDates: { dateStr: string, period: number }[] = [];
    
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Scan forward up to 60 days
    for (let i = 1; i <= 60; i++) {
      const scanDate = new Date(currentDate);
      scanDate.setDate(scanDate.getDate() + i);
      const dayStr = scanDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const dayClasses = studentData.timetable.sessions.filter(s => s.day.toLowerCase() === dayStr.toLowerCase() && s.subjectCode === subjectCode);
      
      for (const cls of dayClasses) {
        foundClasses++;
        recoveryDates.push({
          dateStr: scanDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
          period: cls.period
        });

        if (foundClasses >= requiredClasses) {
          return {
            dates: recoveryDates,
            achievedOn: scanDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            impossible: false
          };
        }
      }
    }

    return {
      dates: recoveryDates,
      achievedOn: null,
      impossible: true
    };
  };

  if (subjectsNeedingRecovery.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: '2rem', border: '2px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
        <span>🔴</span> ATTENDANCE RECOVERY PLAN
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {subjectsNeedingRecovery.map(sub => {
          const plan = getRecoveryPlan(sub.subjectCode, sub.attendedHours, sub.conductedHours);
          const percentage = (sub.attendedHours / sub.conductedHours) * 100;
          const required = engine.calculateRecoveryHours(sub.attendedHours, sub.conductedHours) || 0;
          
          let expectedPercentage = percentage;
          if (plan && !plan.impossible) {
            expectedPercentage = ((sub.attendedHours + required) / (sub.conductedHours + required)) * 100;
          }

          return (
            <div key={sub.subjectCode}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{sub.subjectName}</div>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <div>Current: <strong style={{ color: 'var(--text-color)' }}>{percentage.toFixed(1)}%</strong></div>
                <div>Required recovery: <strong style={{ color: 'var(--text-color)' }}>{required} attended classes</strong></div>
              </div>

              {plan ? (
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Next available {sub.subjectCode} classes:
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {plan.dates.map((d, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0.5rem 1rem', borderBottom: i < plan.dates.length - 1 ? '1px solid var(--border-color)' : 'none', backgroundColor: 'var(--bg-card)' }}>
                        <div>{d.dateStr}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Period {d.period}</div>
                      </div>
                    ))}
                  </div>

                  {plan.impossible ? (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '6px', fontSize: '0.9rem' }}>
                      ⚠️ Recovery cannot be reached within the currently available 60-day timetable window.
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>If you attend these {required} classes:</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {percentage.toFixed(1)}% → <span style={{ color: '#22c55e' }}>{expectedPercentage.toFixed(1)}% 🟢</span>
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        Recovery achieved on: <strong>{plan.achievedOn}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Please import a timetable to generate a recovery path.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

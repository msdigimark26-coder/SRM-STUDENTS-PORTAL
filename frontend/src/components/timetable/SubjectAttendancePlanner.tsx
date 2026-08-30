import React from 'react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface SubjectAttendancePlannerProps {
  studentData: NormalizedStudentData;
}

export const SubjectAttendancePlanner: React.FC<SubjectAttendancePlannerProps> = ({ studentData }) => {
  const engine = new AttendanceEngine();
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);

  const getNextClass = (subjectCode: string) => {
    if (!studentData.timetable || !studentData.timetable.sessions) return null;
    
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check today
    const todayClasses = studentData.timetable.sessions.filter(s => s.day.toLowerCase() === todayStr.toLowerCase() && s.subjectCode === subjectCode && s.startTime > timeStr);
    if (todayClasses.length > 0) {
      return `Today ${todayClasses[0].startTime}`;
    }

    // Check next 6 days
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      const dayClasses = studentData.timetable.sessions.filter(s => s.day.toLowerCase() === dayStr.toLowerCase() && s.subjectCode === subjectCode);
      if (dayClasses.length > 0) {
        if (i === 1) return `Tomorrow ${dayClasses[0].startTime}`;
        return `${dayStr} ${dayClasses[0].startTime}`;
      }
    }
    
    return null;
  };

  return (
    <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary-color)', backgroundColor: 'transparent' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span>📚</span> SUBJECT ATTENDANCE HEALTH
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {results.map((sub) => {
          if (sub.conductedHours === 0) return null;
          
          const percentage = (sub.attendedHours / sub.conductedHours) * 100;
          const safeMisses = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
          const recovery = engine.calculateRecoveryHours(sub.attendedHours, sub.conductedHours) || 0;
          const nextClass = getNextClass(sub.subjectCode);
          
          const ifAttend = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 1, 0) || 0;
          const ifBunk = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 0, 1) || 0;

          let riskLabel = 'SAFE';
          let riskIcon = '🟢';
          let recommendation = '';
          let recommendationColor = '';

          if (percentage < 75) {
            riskLabel = 'HIGH PRIORITY';
            riskIcon = '🔴';
            recommendation = '⚠️ Recovery required. Prioritize attending this class.';
            recommendationColor = '#ef4444';
          } else if (ifBunk < 75) {
            riskLabel = 'WATCH';
            riskIcon = '🟠';
            recommendation = '⚠️ You can technically miss this class, but you will reach the minimum threshold. Better choice: ATTEND';
            recommendationColor = '#f97316';
          } else {
            riskLabel = 'LOW RISK';
            riskIcon = '🟢';
            recommendation = '🟢 You have a large attendance buffer. SAFE TO MISS';
            recommendationColor = '#22c55e';
          }

          return (
            <div key={sub.subjectCode} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{sub.subjectName}</h4>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{sub.attendedHours} / {sub.conductedHours} • <strong style={{ color: 'var(--text-color)', fontSize: '1.1rem' }}>{percentage.toFixed(1)}%</strong></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <span>{riskIcon}</span> {riskLabel}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Safe to miss:</div>
                  <div style={{ fontWeight: 600 }}>{safeMisses} class{safeMisses !== 1 ? 'es' : ''}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Recovery needed:</div>
                  <div style={{ fontWeight: 600 }}>{recovery > 0 ? `${recovery} class${recovery > 1 ? 'es' : ''}` : '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Next class:</div>
                  <div style={{ fontWeight: 600 }}>{nextClass || 'Not scheduled'}</div>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: `4px solid ${recommendationColor}` }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>IF ATTEND</span>
                    <strong style={{ color: '#22c55e' }}>{ifAttend.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>IF BUNK</span>
                    <strong style={{ color: ifBunk < 75 ? '#ef4444' : 'inherit' }}>{ifBunk.toFixed(1)}%</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: recommendationColor, fontWeight: 500 }}>
                  {recommendation}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

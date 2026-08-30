import React, { useEffect } from 'react';
import { Calendar } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';

interface AttendanceAlertsProps {
  studentData: NormalizedStudentData;
}

export const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({ studentData }) => {
  const engine = new AttendanceEngine();
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);
  useEffect(() => {
    // Notification logic placeholder
  }, []);

  const getAlerts = () => {
    const alerts: { type: string, node: React.ReactNode, title: string, body: string }[] = [];

    results.forEach(sub => {
      if (sub.conductedHours === 0) return;
      const percentage = (sub.attendedHours / sub.conductedHours) * 100;
      
      const ifMissedNext = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 0, 1) || 0;
      
      const targetPct = (engine as any).config?.targetPercentage || 75; // Safely access current target

      if (percentage >= targetPct && ifMissedNext < targetPct) {
        alerts.push({
          type: 'risk',
          title: 'Attendance Risk',
          body: `${sub.subjectName}: One more absence brings you below ${targetPct}%.`,
          node: (
          <div key={`risk-${sub.subjectCode}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span>🔴</span>
            <div>
              <div style={{ fontWeight: 600 }}>{sub.subjectName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>One more absence may bring you below {targetPct}%.</div>
            </div>
          </div>
          )
        });
      } else if (percentage === targetPct) {
        alerts.push({
          type: 'watch',
          title: 'Attendance Watch',
          body: `${sub.subjectName}: Attendance is exactly ${targetPct}%.`,
          node: (
          <div key={`watch-${sub.subjectCode}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span>🟠</span>
            <div>
              <div style={{ fontWeight: 600 }}>{sub.subjectName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attendance is exactly {targetPct}%. Avoid unnecessary absence.</div>
            </div>
          </div>
          )
        });
      } else if (percentage >= targetPct) {
        const safeMiss = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
        if (safeMiss >= 3) {
          alerts.push({
            type: 'safe',
            title: 'Safe Classes',
            body: `${sub.subjectName}: You have ${safeMiss} safe misses available.`,
            node: (
            <div key={`safe-${sub.subjectCode}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span>🟢</span>
              <div>
                <div style={{ fontWeight: 600 }}>{sub.subjectName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>You have {safeMiss} safe misses available.</div>
              </div>
            </div>
            )
          });
        }
      } else {
        alerts.push({
          type: 'recover',
          title: 'Recovery Needed',
          body: `${sub.subjectName}: Attendance is below ${targetPct}%. Need recovery.`,
          node: (
          <div key={`recover-${sub.subjectCode}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span>🔴</span>
            <div>
              <div style={{ fontWeight: 600 }}>{sub.subjectName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Attendance is below {targetPct}%. Need recovery.</div>
            </div>
          </div>
          )
        });
      }
    });

    return alerts.slice(0, 4);
  };

  const getCalendarAlerts = () => {
    if (!studentData.timetable || !studentData.timetable.sessions || studentData.timetable.sessions.length === 0) return null;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
    
    const classes = studentData.timetable.sessions.filter(s => s.day.toLowerCase() === tomorrowStr.toLowerCase());
    
    if (classes.length === 0) return null;

    return (
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} /> TOMORROW
        </h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>You have {classes.length} classes.</p>
        
        {classes.map((cls, idx) => {
          const sub = results.find(r => r.subjectCode === cls.subjectCode);
          if (!sub || sub.conductedHours === 0) return null;
          
          const pct = (sub.attendedHours / sub.conductedHours) * 100;
          const ifMissedNext = engine.calculateProjected(sub.attendedHours, sub.conductedHours, 0, 1) || 0;
          const targetPct = (engine as any).config?.targetPercentage || 75;
          
          let status = '';
          if (pct < targetPct || ifMissedNext < targetPct) {
            status = '⚠️ Recommended: ATTEND';
          } else {
            const safeMiss = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) || 0;
            if (safeMiss > 1) {
              status = `🟢 ${safeMiss} safe misses available`;
            } else {
              status = `🟢 safe buffer`;
            }
          }

          return (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>{sub.subjectName.split(' ').slice(0, 3).join(' ')}</span> — <span>{status}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span>🔔</span> ATTENDANCE ALERTS
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {getAlerts().map((alert, i) => (
          <React.Fragment key={i}>{alert.node}</React.Fragment>
        ))}
      </div>
      {getCalendarAlerts()}
    </div>
  );
};

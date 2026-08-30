import React, { useMemo } from 'react';
import type { NormalizedStudentData, Timetable } from '@srm/shared';
import { getNextClass } from '../utils/timetableUtils';
import { simulateAttendance } from '@srm/shared';
import { TimetableManager } from './timetable/TimetableManager';

interface NextClassSimulatorProps {
  studentData: NormalizedStudentData;
  onUpdateTimetable: (timetable: Timetable | null) => void;
}

export const NextClassSimulator: React.FC<NextClassSimulatorProps> = ({ studentData, onUpdateTimetable }) => {
  const nextClass = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const now = new Date();
    const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return getNextClass(studentData.timetable, today, currentTimeString);
  }, [studentData.timetable]);

  if (!studentData.timetable || !studentData.timetable.sessions || studentData.timetable.sessions.length === 0) {
    return (
      <TimetableManager studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
    );
  }

  if (!nextClass) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>"Can I Bunk Next Hour?"</h3>
          <button onClick={() => onUpdateTimetable(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'var(--text-color)', fontSize: '0.8rem' }}>Clear Timetable</button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>You have no upcoming classes today!</p>
      </div>
    );
  }

  const subjectRecord = studentData.attendance.find(a => a.subjectCode === nextClass.subjectCode);

  if (!subjectRecord) {
    return (
      <div className="card">
        <h3>Next Class: {nextClass.subjectName} ({nextClass.subjectCode})</h3>
        <p style={{ color: 'var(--text-muted)' }}>Attendance data not found for this subject.</p>
      </div>
    );
  }

  const current = { attended: subjectRecord.attendedHours, conducted: subjectRecord.conductedHours };
  
  const ifAttended = simulateAttendance({ current, changes: { attend: 1 } });
  const ifMissed = simulateAttendance({ current, changes: { miss: 1 } });

  const currentPercentage = current.conducted > 0 ? ((current.attended / current.conducted) * 100).toFixed(2) : '0.00';

  const statusLabel = ifMissed.status === 'SAFE' || ifMissed.status === 'WATCH' ? 'SAFE' : 
                      ifMissed.status === 'AT_RISK' ? 'RISKY' : "DON'T BUNK";
                      
  const statusClass = ifMissed.status === 'SAFE' || ifMissed.status === 'WATCH' ? 'status-safe' : 
                      ifMissed.status === 'AT_RISK' ? 'status-at_risk' : 'status-below_target';

  return (
    <div className={`card ${statusClass}`} style={{ borderLeft: '4px solid currentColor' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Next Class: {nextClass.subjectName}
            <button onClick={() => onUpdateTimetable(null)} style={{ background: 'transparent', border: '1px solid currentColor', borderRadius: '4px', padding: '0.15rem 0.35rem', cursor: 'pointer', color: 'currentColor', fontSize: '0.65rem' }}>Clear Timetable</button>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {nextClass.subjectCode} • {nextClass.startTime} - {nextClass.endTime}
          </p>
        </div>
        <div style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold', backgroundColor: 'currentColor', color: 'var(--bg-card)' }}>
          {statusLabel}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.5rem', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{currentPercentage}%</div>
          <div style={{ fontSize: '0.8rem' }}>{current.attended} / {current.conducted}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>If Attended</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{ifAttended.percentage.toFixed(2)}%</div>
          <div style={{ fontSize: '0.8rem' }}>{ifAttended.attended} / {ifAttended.conducted}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>If Missed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{ifMissed.percentage.toFixed(2)}%</div>
          <div style={{ fontSize: '0.8rem' }}>{ifMissed.attended} / {ifMissed.conducted}</div>
        </div>
      </div>
    </div>
  );
};

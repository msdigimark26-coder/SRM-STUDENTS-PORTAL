import React from 'react';
import type { TimetablePeriod, NormalizedStudentData } from '@srm/shared';
import { simulateAttendance } from '@srm/shared';

interface ClassBunkSimulatorModalProps {
  period: TimetablePeriod;
  studentData: NormalizedStudentData;
  onClose: () => void;
}

export const ClassBunkSimulatorModal: React.FC<ClassBunkSimulatorModalProps> = ({ period, studentData, onClose }) => {
  const subjectRecord = studentData.attendance.find(a => a.subjectCode === period.subjectCode);

  if (!subjectRecord) {
    return (
      <div className="modal-overlay" onClick={onClose} style={overlayStyle}>
        <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%' }}>
          <h3>{period.subjectName}</h3>
          <p>No attendance data available for this subject.</p>
          <button onClick={onClose} style={closeBtnStyle}>Close</button>
        </div>
      </div>
    );
  }

  const current = { attended: subjectRecord.attendedHours, conducted: subjectRecord.conductedHours };
  
  const currentPercentage = current.conducted > 0 ? ((current.attended / current.conducted) * 100).toFixed(1) : '0.0';
  const ifAttended = simulateAttendance({ current, changes: { attend: 1 } });
  const ifMissed = simulateAttendance({ current, changes: { miss: 1 } });

  const safeToBunk = ifMissed.status === 'SAFE' || ifMissed.status === 'WATCH';
  const isRisky = ifMissed.status === 'AT_RISK';

  let reason = '';
  if (safeToBunk) {
    reason = `You have enough buffer. Missing this will keep you at ${ifMissed.percentage.toFixed(1)}%.`;
  } else if (isRisky) {
    reason = `You will drop to ${ifMissed.percentage.toFixed(1)}%, getting dangerously close to 75%.`;
  } else {
    reason = `You will drop below the 75% threshold to ${ifMissed.percentage.toFixed(1)}%.`;
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div className={`card`} onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        
        <h2 style={{ margin: '0 0 1rem 0' }}>{period.subjectName}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <div>Current</div>
          <div style={{ fontWeight: 600 }}>{currentPercentage}%</div>
          
          <div>Attend</div>
          <div style={{ fontWeight: 600 }}>{ifAttended.percentage.toFixed(1)}% 🟢</div>
          
          <div>Bunk</div>
          <div style={{ fontWeight: 600 }}>{ifMissed.percentage.toFixed(1)}% {safeToBunk ? '🟢' : isRisky ? '🟠' : '🔴'}</div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-card-hover)', borderLeft: `4px solid ${safeToBunk ? '#22c55e' : isRisky ? '#f97316' : '#ef4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            <span>Safe to bunk?</span>
            <span style={{ color: safeToBunk ? '#22c55e' : isRisky ? '#f97316' : '#ef4444' }}>{safeToBunk ? 'YES' : 'NO'}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <strong>Reason:</strong> {reason}
          </p>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  padding: '1rem'
};

const closeBtnStyle: React.CSSProperties = {
  marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--border-color)', 
  border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%'
};

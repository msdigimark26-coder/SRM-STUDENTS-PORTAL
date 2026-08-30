import React from 'react';
import type { TimetablePeriod } from '@srm/shared';

interface TodayTimetableProps {
  todaysClasses: TimetablePeriod[];
  onClassClick: (period: TimetablePeriod) => void;
}

export const TodayTimetable: React.FC<TodayTimetableProps> = ({ todaysClasses, onClassClick }) => {
  if (todaysClasses.length === 0) {
    return (
      <div className="card" style={{ opacity: 0.7 }}>
        <h3>Today's Timetable</h3>
        <p style={{ color: 'var(--text-muted)' }}>No classes scheduled for today!</p>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>TODAY — {todayStr}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {todaysClasses.map((cls, idx) => (
          <div 
            key={idx} 
            onClick={() => onClassClick(cls)}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '100px 1fr', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              backgroundColor: 'var(--bg-card-hover)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              alignItems: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {cls.startTime}–{cls.endTime}
            </div>
            <div style={{ fontWeight: 600 }}>
              {cls.subjectName}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        Click any class to simulate bunking
      </p>
    </div>
  );
};

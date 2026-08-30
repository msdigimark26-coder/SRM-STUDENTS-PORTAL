import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { determineHealthStatus } from '@srm/shared';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';
import { AttendanceEngine } from '../../engines/AttendanceEngine';

interface AttendanceCalendarProps {
  studentData: NormalizedStudentData;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ studentData }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDate(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const engine = new AttendanceEngine();
  const baseResults = engine.processSubjects(studentData.subjects, studentData.attendance);
  const totalAttended = baseResults.reduce((sum, r) => sum + r.attendedHours, 0);
  const totalConducted = baseResults.reduce((sum, r) => sum + r.conductedHours, 0);
  const baseline = engine.calculateCurrent(totalAttended, totalConducted);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Map Sunday (0) to 6, Monday (1) to 0
  };

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const calendarDays = useMemo(() => {
    if (!studentData.timetable || !studentData.timetable.sessions) return [];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: any[] = Array(firstDay).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      const scheduledClasses = studentData.timetable.sessions
        .filter(s => s.day.toLowerCase() === dayName.toLowerCase())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      let status = 'NO_CLASSES';
      let projectedAttendedPercentage = baseline;
      let projectedMissedPercentage = baseline;

      if (scheduledClasses.length > 0) {
        if (isPast) {
          status = 'PAST';
        } else {
          // Simulate full absence
          let simAttended = totalAttended;
          let simConducted = totalConducted;
          
          scheduledClasses.forEach(cls => {
            const record = studentData.attendance.find(a => a.subjectCode === cls.subjectCode);
            if (record) {
              simConducted++;
            }
          });

          projectedMissedPercentage = simConducted > 0 ? (simAttended / simConducted) * 100 : baseline;
          
          // Simulate full attendance
          let simAllAttended = totalAttended;
          scheduledClasses.forEach(cls => {
            const record = studentData.attendance.find(a => a.subjectCode === cls.subjectCode);
            if (record) {
              simAllAttended++;
            }
          });
          projectedAttendedPercentage = simConducted > 0 ? (simAllAttended / simConducted) * 100 : baseline;

          if ((projectedMissedPercentage || 0) >= 80) {
            status = 'SAFE';
          } else if ((projectedMissedPercentage || 0) >= 75) {
            status = 'WATCH';
          } else {
            status = 'DANGER';
          }
        }
      }

      days.push({
        date,
        dayOfMonth: i,
        dayName,
        isPast,
        isToday,
        scheduledClasses,
        status,
        projectedAttendedPercentage,
        projectedMissedPercentage
      });
    }

    return days;
  }, [viewDate, studentData, totalAttended, totalConducted, baseline]);

  const monthSummary = useMemo(() => {
    let classes = 0;
    let safeDays = 0;
    let watchDays = 0;
    let riskDays = 0;

    calendarDays.forEach(day => {
      if (!day || day.isPast || day.scheduledClasses.length === 0) return;
      classes += day.scheduledClasses.length;
      if (day.status === 'SAFE') safeDays++;
      else if (day.status === 'WATCH') watchDays++;
      else if (day.status === 'DANGER') riskDays++;
    });

    return { classes, safeDays, watchDays, riskDays };
  }, [calendarDays]);

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const renderModal = () => {
    if (!selectedDate) return null;

    const dayData = calendarDays.find(d => d && d.date.getTime() === selectedDate.getTime());
    if (!dayData) return null;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setSelectedDate(null)}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <button 
              onClick={() => setSelectedDate(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              TODAY'S SCHEDULE
            </div>

            {dayData.scheduledClasses.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                ⚪ No classes scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayData.scheduledClasses.map((cls: TimetablePeriod, idx: number) => {
                  const record = studentData.attendance.find(a => a.subjectCode === cls.subjectCode);
                  const health = record ? determineHealthStatus(record.attendedHours / record.conductedHours * 100, 75, 5, 5) : 'SAFE';
                  const healthIcon = health === 'BELOW_TARGET' ? '🔴' : health === 'AT_RISK' ? '🟠' : '🟢';
                  
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{cls.startTime}</span>
                        <span style={{ fontWeight: 500 }}>{cls.subjectName.split(' ').slice(0, 3).join(' ')}</span>
                      </div>
                      <div>{healthIcon}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {dayData.scheduledClasses.length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                {dayData.isPast ? (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span>⚪</span> <strong style={{ color: 'var(--text-color)' }}>HISTORICAL DATA UNAVAILABLE</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      We don't have SRMIST attendance history for this date, so attendance cannot be determined.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>CURRENT ATTENDANCE</span>
                      <strong style={{ fontSize: '1rem' }}>{(baseline || 0).toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>IF ALL SCHEDULED CLASSES ATTENDED</span>
                      <strong style={{ color: '#22c55e' }}>{dayData.projectedAttendedPercentage.toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>IF ALL SCHEDULED CLASSES MISSED</span>
                      <strong style={{ color: '#ef4444' }}>{dayData.projectedMissedPercentage.toFixed(1)}%</strong>
                    </div>
                    <button 
                      onClick={() => setSelectedDate(null)}
                      style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      [ View Day Planner ]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ border: 'none', backgroundColor: 'transparent', padding: 0, marginBottom: '2.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={handlePrevMonth} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          ‹ Previous
        </button>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
          <Calendar size={20} /> {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          Next ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Classes</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{monthSummary.classes}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Safe Days</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#22c55e' }}>{monthSummary.safeDays}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Watch Days</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f97316' }}>{monthSummary.watchDays}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Risk Days</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#ef4444' }}>{monthSummary.riskDays}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {dayNames.map(day => (
          <div key={day} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          
          let dot = null;
          if (day.status === 'NO_CLASSES') dot = <span style={{ color: 'transparent', fontSize: '0.6rem' }}>⚪</span>;
          else if (day.status === 'PAST') dot = <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>⚫</span>;
          else if (day.status === 'SAFE') dot = <span style={{ color: '#22c55e', fontSize: '0.6rem' }}>🟢</span>;
          else if (day.status === 'WATCH') dot = <span style={{ color: '#f97316', fontSize: '0.6rem' }}>🟠</span>;
          else if (day.status === 'DANGER') dot = <span style={{ color: '#ef4444', fontSize: '0.6rem' }}>🔴</span>;

          return (
            <div 
              key={`day-${day.dayOfMonth}`}
              onClick={() => setSelectedDate(day.date)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: day.isToday ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                border: day.isToday ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = day.isToday ? '#3b82f6' : 'var(--border-color)'}
            >
              <div style={{ fontWeight: 500, marginBottom: '0.15rem', color: day.isPast ? 'var(--text-muted)' : 'var(--text-color)' }}>
                {day.dayOfMonth}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: day.scheduledClasses.length > 0 ? '0.15rem' : '0' }}>
                {dot}
              </div>
              {day.scheduledClasses.length > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {day.scheduledClasses.length} class{day.scheduledClasses.length > 1 ? 'es' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>🟢</span> SAFE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>🟠</span> WATCH</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>🔴</span> AT RISK</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚪</span> NO CLASSES</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>⚫</span> HISTORICAL</div>
      </div>

      {renderModal()}
    </div>
  );
};

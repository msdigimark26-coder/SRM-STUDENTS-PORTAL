import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Heart, Sun, TrendingUp, Target, ClipboardList } from 'lucide-react';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import { NextClassSimulator } from './NextClassSimulator';
import { TodayTimetable } from './timetable/TodayTimetable';

import { ClassBunkSimulatorModal } from './timetable/ClassBunkSimulatorModal';
import { SickLeavePlanner } from './timetable/SickLeavePlanner';
import { SelectivePeriodPlanner } from './timetable/SelectivePeriodPlanner';
import { SafestCombinationPlanner } from './timetable/SafestCombinationPlanner';
import { WeeklyStrategyPlanner } from './timetable/WeeklyStrategyPlanner';

import { SubjectAttendancePlanner } from './timetable/SubjectAttendancePlanner';
import { SafestClassesToMiss } from './timetable/SafestClassesToMiss';
import { RecoveryCalendar } from './timetable/RecoveryCalendar';


interface LeaveSimulatorProps {
  studentData: NormalizedStudentData;
  onUpdateTimetable: (timetable: any) => void;
  engine: AttendanceEngine;
}

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
type SubTab = 'full' | 'partial' | 'sick' | 'weekend' | 'bunk' | 'recover' | 'safest';

export const LeaveSimulator: React.FC<LeaveSimulatorProps> = ({ studentData, onUpdateTimetable, engine }) => {
  const [selectedClass, setSelectedClass] = useState<TimetablePeriod | null>(null);
  const [selectedDay, setSelectedDay] = useState<Weekday>('Monday');
  const [subTab, setSubTab] = useState<SubTab>('full');

  const days: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  let scheduledClasses: TimetablePeriod[] = [];
  let todaysClasses: TimetablePeriod[] = [];

  if (studentData.timetable && studentData.timetable.sessions) {
    scheduledClasses = studentData.timetable.sessions
      .filter(s => s.day.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    todaysClasses = studentData.timetable.sessions
      .filter(s => s.day.toLowerCase() === todayStr.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Full-day impact calculation
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);
  let currentTotalAttended = 0;
  let currentTotalConducted = 0;
  let projectedTotalAttended = 0;
  let projectedTotalConducted = 0;
  let riskSubjectsCount = 0;

  results.forEach(sub => {
    currentTotalAttended += sub.attendedHours;
    currentTotalConducted += sub.conductedHours;
    const scheduledOccurrences = scheduledClasses.filter(c => c.subjectCode === sub.subjectCode).length;
    const pAttended = sub.attendedHours;
    const pConducted = sub.conductedHours + scheduledOccurrences;
    projectedTotalAttended += pAttended;
    projectedTotalConducted += pConducted;
    if (pConducted > 0 && (pAttended / pConducted) * 100 < 75) riskSubjectsCount++;
  });

  const currentOverall = currentTotalConducted > 0 ? (currentTotalAttended / currentTotalConducted) * 100 : 0;
  const projectedOverall = projectedTotalConducted > 0 ? (projectedTotalAttended / projectedTotalConducted) * 100 : 0;
  const delta = projectedOverall - currentOverall;

  const subTabBtns: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'full', icon: <Calendar size={16} />, label: 'Full-Day Leave' },
    { key: 'bunk', icon: <Clock size={16} />, label: 'Class Bunk' },
    { key: 'partial', icon: <BookOpen size={16} />, label: 'Partial-Day' },
    { key: 'sick', icon: <Heart size={16} />, label: 'Sick Leave' },
    { key: 'weekend', icon: <Sun size={16} />, label: 'Long Weekend' },
    { key: 'recover', icon: <TrendingUp size={16} />, label: 'Recovery Plan' },
    { key: 'safest', icon: <Target size={16} />, label: 'Safest Classes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header + day selector */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}><Calendar size={24} /></span> "Can I Take Leave?" — Leave & Absence Planner
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Simulate full-day, partial-day, class bunk, or sick-day absences using your official class schedule.
            </p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', padding: '0.25rem', flexWrap: 'wrap', gap: '0.1rem' }}>
            {days.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} style={{ background: selectedDay === d ? 'rgba(59,130,246,0.2)' : 'transparent', color: selectedDay === d ? 'var(--primary)' : 'var(--text-muted)', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: selectedDay === d ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled classes for selected day */}
        {studentData.timetable ? (
          <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              SCHEDULED CLASSES ON {selectedDay.toUpperCase()} ({scheduledClasses.length} PERIODS)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {scheduledClasses.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No classes scheduled for {selectedDay}.</div>
              ) : (
                scheduledClasses.map((cls, idx) => (
                  <div key={idx} onClick={() => setSelectedClass(cls)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', minWidth: '120px', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span>PERIOD {cls.period || idx + 1}</span>
                      <span>{cls.startTime}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cls.subjectCode}</div>
                    {cls.subjectName && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{cls.subjectName}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><ClipboardList size={32} /></div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>No timetable uploaded yet. Upload your SRM timetable image to enable full planning features.</div>
          </div>
        )}

        {/* Sub-tab buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {subTabBtns.map(btn => (
            <button key={btn.key} onClick={() => setSubTab(btn.key)} style={{ background: subTab === btn.key ? 'rgba(59,130,246,0.15)' : 'transparent', border: subTab === btn.key ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)', color: subTab === btn.key ? 'var(--primary)' : 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: subTab === btn.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-Day Leave ── */}
      {subTab === 'full' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ margin: 0 }}>Full-Day Absence Impact on {selectedDay}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Simulates missing all {scheduledClasses.length} scheduled classes for the entire day.
              </p>
            </div>
            {scheduledClasses.length > 0 && (
              <span style={{ border: `1px solid ${delta < -1 ? 'var(--status-risk)' : 'var(--status-watch)'}`, color: delta < -1 ? 'var(--status-risk)' : 'var(--status-watch)', background: delta < -1 ? 'var(--status-risk-bg)' : 'var(--status-watch-bg)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                {delta < -2 ? 'HIGH RISK' : 'MEDIUM RISK'}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[['CURRENT OVERALL', `${currentOverall.toFixed(1)}%`, 'var(--text-main)'], ['PROJECTED OVERALL', `${projectedOverall.toFixed(1)}%`, 'var(--primary)'], ['NET CHANGE', `${delta < 0 ? '' : '+'}${delta.toFixed(2)}%`, delta < 0 ? 'var(--status-risk)' : 'var(--status-safe)']].map(([label, val, color]) => (
              <div key={label as string} style={{ background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: color as string }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
            💬 <strong>Projection Assessment:</strong> {scheduledClasses.length === 0 ? `No scheduled classes on ${selectedDay}.` : `Taking a full day leave on ${selectedDay} will cause ${riskSubjectsCount} subject(s) to fall below the 75% threshold.`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
            Note: Mathematically, this projection shows the estimated impact. It does not constitute official leave approval.
          </div>
          {studentData.timetable && (
            <div style={{ marginTop: '1.5rem' }}>
              <SafestCombinationPlanner studentData={studentData} todaysClasses={todaysClasses} />
            </div>
          )}
        </div>
      )}

      {/* ── Class / Period Bunk ── */}
      {subTab === 'bunk' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20} color="var(--primary)" /> Class Bunk / Period Bunk Simulator</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click any scheduled class card above to simulate missing that specific period, or use the planner below.</p>
          {studentData.timetable ? (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <SelectivePeriodPlanner studentData={studentData} todaysClasses={scheduledClasses} />
              <TodayTimetable todaysClasses={todaysClasses} onClassClick={setSelectedClass} />
            </div>
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Partial-Day ── */}
      {subTab === 'partial' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={20} color="var(--primary)" /> Partial-Day Optimizer</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Simulate skipping selected periods while attending others.</p>
          {studentData.timetable ? (
            <SelectivePeriodPlanner studentData={studentData} todaysClasses={scheduledClasses} />
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Sick Today ── */}
      {subTab === 'sick' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={20} color="var(--primary)" /> Sick Leave Planner</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Multi-day sick leave impact — shows daily and cumulative projections.</p>
          {studentData.timetable ? (
            <SickLeavePlanner studentData={studentData} />
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Smart Weekend ── */}
      {subTab === 'weekend' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sun size={20} color="var(--primary)" /> Smart Long Weekend Planner</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Analyze the safest days (Monday/Friday) to take off for a 3-day or 4-day weekend.</p>
          {studentData.timetable ? (
            <WeeklyStrategyPlanner studentData={studentData} planMode={null} setPlanMode={() => {}} />
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Recovery Plan ── */}
      {subTab === 'recover' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} color="var(--primary)" /> Recovery Calendar & Planner</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>See exactly which future classes you need to attend to recover to 75%.</p>
          {studentData.timetable ? (
            <RecoveryCalendar studentData={studentData} />
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Safest Classes ── */}
      {subTab === 'safest' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={20} color="var(--primary)" /> Safest Classes to Miss</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Identifies which classes you can safely skip without falling below 75%.</p>
          {studentData.timetable ? (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <SafestClassesToMiss studentData={studentData} />
              <SubjectAttendancePlanner studentData={studentData} />
            </div>
          ) : (
            <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
          )}
        </div>
      )}

      {/* ── Always show: Timetable upload / Next Class ── */}
      <NextClassSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} />      {/* Class bunk modal */}
      {selectedClass && (
        <ClassBunkSimulatorModal
          period={selectedClass}
          studentData={studentData}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
};



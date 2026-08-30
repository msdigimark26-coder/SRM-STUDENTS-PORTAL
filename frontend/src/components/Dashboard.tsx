import React from 'react';
import { GraduationCap, Scale } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import { StudentSummary } from './StudentSummary';
import { AttendanceHealthCard } from './AttendanceHealthCard';
import { SubjectAttendanceTable } from './SubjectAttendanceTable';
import { AttendanceTrendGraph } from './AttendanceTrendGraph';
import { LeaveSimulator } from './LeaveSimulator';
import { Disclaimer } from './Disclaimer';
import { WhatIfSimulator } from './WhatIfSimulator';
import { CreditPriorities } from './CreditPriorities';
import { AttendanceCalendar } from './timetable/AttendanceCalendar';
import { TodayTimetable } from './timetable/TodayTimetable';
import { TimetableManager } from './timetable/TimetableManager';
import type { TimetablePeriod } from '@srm/shared';
import { AiChat } from './AiChat';
import { AcademicDashboardCard } from './academic/AcademicDashboardCard';
import { AcademicPerformanceModule } from './academic/AcademicPerformanceModule';

import type { TabType } from './TopNav';

interface DashboardProps {
  studentData: NormalizedStudentData;
  onUpdateTimetable: (timetable: any) => void;
  onUpdateAcademicData: (academic: any) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ studentData, onUpdateTimetable, onUpdateAcademicData, activeTab, onTabChange }) => {
  const engine = new AttendanceEngine();
  const results = engine.processSubjects(studentData.subjects, studentData.attendance);

  let todaysClasses: TimetablePeriod[] = [];
  if (studentData.timetable && studentData.timetable.sessions) {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    todaysClasses = studentData.timetable.sessions
      .filter(s => s.day.toLowerCase() === todayStr.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div className="dashboard-grid">
      <div className="dashboard-header-row" style={{ marginBottom: '1.5rem' }}>
        <StudentSummary profile={studentData.profile} semester={studentData.currentSemester} />
      </div>

      
      <div className="tab-content" key={activeTab}>
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AttendanceHealthCard 
              studentData={studentData}
              results={results}
              engine={engine}
            />
            
            <AcademicDashboardCard 
              studentData={studentData} 
              onViewPlanner={() => onTabChange('academic')} 
            />

            {/* Quick Actions Grid */}
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', border: '1px solid var(--border-active)', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), transparent)' }} onClick={() => onTabChange('leave')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={24} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Can I Bunk?</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left', margin: 0 }}>Indha class bunk pannalama? Smart-ah decide pannu.</p>
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <AttendanceTrendGraph studentData={studentData} targetPct={(engine as any).config?.targetPercentage || 75} />
                </div>
              </div>
                
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }} onClick={() => onTabChange('whatif')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={24} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>What If?</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left', margin: 0 }}>Leave edutha percentage evlo aagum? Simulate pannu.</p>
                </button>
              </div>

              {studentData.timetable ? (
                <TodayTimetable todaysClasses={todaysClasses} onClassClick={() => {}} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <TimetableManager studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
                </div>
              )}
            </div>

            <SubjectAttendanceTable subjects={results} engine={engine} />
          </div>
        )}

        {activeTab === 'calendar' && studentData.timetable && (
          <AttendanceCalendar studentData={studentData} />
        )}
        {activeTab === 'calendar' && !studentData.timetable && (
          <TimetableManager studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
        )}

        {activeTab === 'leave' && (
          <LeaveSimulator studentData={studentData} onUpdateTimetable={onUpdateTimetable} engine={engine} />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulator studentData={studentData} results={results} engine={engine} />
        )}

        {activeTab === 'priority' && (
          <CreditPriorities studentData={studentData} results={results} engine={engine} />
        )}

        {activeTab === 'ai' && (
          <AiChat studentData={studentData} onUpdateTimetable={onUpdateTimetable} />
        )}

        {activeTab === 'academic' && (
          <AcademicPerformanceModule studentData={studentData} onUpdateAcademicData={onUpdateAcademicData} />
        )}
      </div>

      <Disclaimer />
    </div>
  );
};

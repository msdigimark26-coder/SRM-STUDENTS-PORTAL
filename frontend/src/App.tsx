import { useState, useEffect, useRef } from 'react';
import type { ConnectionState, NormalizedStudentData } from '@srm/shared';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { ManualSubjectEntry, loadManualSubjects } from './components/ManualSubjectEntry';
import type { ManualSubject } from './components/ManualSubjectEntry';
import { TopNav } from './components/TopNav';
import type { TabType } from './components/TopNav';
import { BottomNav } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { apiFetch } from './utils/api';
import './App.css';

const ACADEMIC_STORAGE_KEY = 'srm_academic_data';

/** Build a NormalizedStudentData from manually entered subjects */
function buildManualStudentData(subjects: ManualSubject[]): NormalizedStudentData {
  return {
    profile: {
      name: 'Manual Entry',
      studentId: '—',
      program: 'Manual Mode',
      department: '—',
    },
    currentSemester: { id: 'manual', name: 'Manual Entry' },
    subjects: subjects.map(s => ({ code: s.code, name: s.name, credits: s.credits })),
    attendance: subjects.map(s => ({
      subjectCode: s.code,
      attendedHours: s.attendedHours,
      conductedHours: s.conductedHours,
      percentage: s.conductedHours === 0 ? 0 : (s.attendedHours / s.conductedHours) * 100,
    })),
  };
}

function App() {
  const [appState, setAppState] = useState<ConnectionState>('DISCONNECTED');
  const [studentData, setStudentData] = useState<NormalizedStudentData | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSubjects, setManualSubjects] = useState<ManualSubject[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [showSettings, setShowSettings] = useState(false);
  const [targetRefresh, setTargetRefresh] = useState(0); // Trigger re-renders on target change
  const pollIntervalRef = useRef<number | null>(null);

  // On mount — load any previously saved manual subjects
  useEffect(() => {
    const saved = loadManualSubjects();
    if (saved && saved.length > 0) {
      setManualSubjects(saved);
    }
  }, []);

  const startPolling = () => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const res = await apiFetch('/api/connect/status');
        if (res.ok) {
          const data = await res.json();
          setAppState(data.state);
          
          if (data.state === 'DATA_READY') {
            stopPolling();
            fetchStudentData();
          } else if (data.state === 'ERROR' || data.state === 'DISCONNECTED' || data.state === 'TIMEOUT') {
            stopPolling();
          }
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    }, 1000);
  };

  const fetchStudentData = async () => {
    try {
      const res = await apiFetch('/api/connect/data');
      if (res.ok) {
        const data = await res.json();
        
        // Load local academic data
        try {
          const savedAcademic = localStorage.getItem(ACADEMIC_STORAGE_KEY);
          if (savedAcademic) {
            data.academic = JSON.parse(savedAcademic);
          }
        } catch (e) {}

        setStudentData(data);
        setIsManualMode(false);
        setActiveTab('health');
      } else {
        setAppState('ERROR');
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      setAppState('ERROR');
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleConnect = async () => {
    setAppState('LAUNCHING');
    setStudentData(null);
    setIsManualMode(false);
    try {
      const res = await apiFetch('/api/connect', { method: 'POST' });
      if (!res.ok) throw new Error('API not available');
      startPolling();
    } catch (err) {
      setAppState('ERROR');
    }
  };

  const handleDisconnect = async () => {
    setAppState('DISCONNECTING');
    try {
      await apiFetch('/api/disconnect', { method: 'POST' });
      setAppState('DISCONNECTED');
      setStudentData(null);
      setIsManualMode(false);
      stopPolling();
    } catch (err) {
      console.error('Failed to disconnect', err);
    }
  };

  const handleUpdateTimetable = (timetable: any) => {
    if (studentData) {
      setStudentData({ ...studentData, timetable });
    }
  };

  const handleManualSave = (subjects: ManualSubject[]) => {
    setManualSubjects(subjects);
    const data = buildManualStudentData(subjects);
    
    // Load local academic data for manual mode too
    try {
      const savedAcademic = localStorage.getItem(ACADEMIC_STORAGE_KEY);
      if (savedAcademic) {
        data.academic = JSON.parse(savedAcademic);
      }
    } catch (e) {}

    setStudentData(data);
    setIsManualMode(true);
    setShowManualEntry(false);
    setAppState('DATA_READY');
    setActiveTab('health');
  };

  const handleUpdateAcademicData = (academic: { pastSemesters: any[], currentSubjects: any[] }) => {
    if (studentData) {
      const updatedData = { ...studentData, academic };
      setStudentData(updatedData);
      localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(academic));
    }
  };

  const handleManualEdit = () => {
    setShowManualEntry(true);
  };

  return (
    <div className="container" key={targetRefresh}>
      <TopNav 
        connectionState={appState} 
        onDisconnect={handleDisconnect} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isManualMode={isManualMode}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onSave={() => setTargetRefresh(prev => prev + 1)} 
        />
      )}
      
      {/* Manual Entry modal */}
      {showManualEntry && (
        <ManualSubjectEntry
          onSave={handleManualSave}
          onClose={() => setShowManualEntry(false)}
          initialSubjects={manualSubjects}
        />
      )}

      {/* "Edit Subjects" floating button in manual mode */}
      {isManualMode && appState === 'DATA_READY' && (
        <button
          onClick={handleManualEdit}
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 8px 32px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ✏️ Edit Subjects
        </button>
      )}

      <main className="main-content">
        {/* Welcome / Landing Screen (when completely disconnected) */}
        {(appState === 'DISCONNECTED' || appState === 'ERROR' || appState === 'TIMEOUT') && (
          <LandingPage onStartPlanning={handleManualEdit} onConnect={handleConnect} />
        )}

        {(appState === 'LAUNCHING' || appState === 'WAITING_FOR_LOGIN' || appState === 'LOGIN_FAILED' || appState === 'DISCONNECTING') && (
          <div className="empty-state connecting">
            <div className="spinner"></div>
            <h2>{appState === 'DISCONNECTING' ? 'Disconnecting...' : (appState === 'WAITING_FOR_LOGIN' || appState === 'LOGIN_FAILED') ? 'SRMIST login window is open.' : 'Connecting to SRMIST...'}</h2>
            <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              {appState === 'LAUNCHING' && <p>Starting secure browser session...</p>}
              {(appState === 'WAITING_FOR_LOGIN' || appState === 'LOGIN_FAILED') && (
                <>
                  <p>Please complete your SRMIST login in the browser window.</p>
                  <p>Your credentials are entered directly into SRMIST and are not handled by this application.</p>
                  <p>
                    {appState === 'LOGIN_FAILED' 
                      ? <strong style={{ color: 'var(--status-danger)' }}>Invalid credentials detected. Please try again.</strong> 
                      : 'Waiting for authentication...'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {appState === 'AUTHENTICATED' && (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', margin: 0 }}></span> Extracting Academic Data...
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Parsing attendance portal and calculating projections.</p>
            </div>
            
            {/* Skeleton Dashboard Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="skeleton-box" style={{ height: '200px', borderRadius: '16px' }}></div>
              <div className="skeleton-box" style={{ height: '200px', borderRadius: '16px' }}></div>
              <div className="skeleton-box" style={{ height: '200px', borderRadius: '16px' }}></div>
            </div>
            
            <div className="skeleton-box" style={{ height: '300px', borderRadius: '16px' }}></div>
          </div>
        )}

        {appState === 'DATA_READY' && studentData && (
          <div>
            {/* Manual mode header banner */}
            {isManualMode && (
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>✏️ <strong style={{ color: '#60a5fa' }}>Manual Entry Mode</strong> — Showing locally entered subjects. Portal data is not connected.</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleManualEdit} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>✏️ Edit Subjects</button>
                  <button onClick={handleConnect} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>🔗 Connect to Portal</button>
                </div>
              </div>
            )}
            <Dashboard 
              studentData={studentData} 
              onUpdateTimetable={handleUpdateTimetable} 
              onUpdateAcademicData={handleUpdateAcademicData}
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            />
          </div>
        )}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        show={appState === 'DATA_READY' && !!studentData} 
      />

      {/* PWA Install Prompt — auto-triggers on Android/Chrome */}
      <PwaInstallPrompt />
    </div>
  );
}

export default App;

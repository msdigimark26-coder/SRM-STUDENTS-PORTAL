import React, { useState, useEffect } from 'react';

export interface ManualSubject {
  code: string;
  name: string;
  credits: number;
  attendedHours: number;
  conductedHours: number;
}

interface ManualSubjectEntryProps {
  onSave: (subjects: ManualSubject[]) => void;
  onClose: () => void;
  initialSubjects?: ManualSubject[];
}

const STORAGE_KEY = 'srm_manual_subjects';

const defaultRow = (): ManualSubject => ({
  code: '',
  name: '',
  credits: 3,
  attendedHours: 0,
  conductedHours: 0,
});

export const ManualSubjectEntry: React.FC<ManualSubjectEntryProps> = ({ onSave, onClose, initialSubjects = [] }) => {
  const [rows, setRows] = useState<ManualSubject[]>(
    initialSubjects.length > 0 ? initialSubjects : [defaultRow()]
  );
  const [error, setError] = useState('');

  // Load saved from localStorage on mount
  useEffect(() => {
    if (initialSubjects.length === 0) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ManualSubject[];
          if (parsed.length > 0) setRows(parsed);
        }
      } catch {}
    }
  }, []);

  const updateRow = (idx: number, field: keyof ManualSubject, value: string | number) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'code' || field === 'name' ? value : Number(value) };
      return next;
    });
    setError('');
  };

  const addRow = () => setRows(prev => [...prev, defaultRow()]);

  const deleteRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const valid = rows.every(r => r.code.trim() && r.name.trim() && r.conductedHours >= 0 && r.attendedHours >= 0 && r.credits >= 0);
    if (!valid) {
      setError('Please fill in all fields. Subject Code, Name are required.');
      return;
    }
    const invalidAttend = rows.some(r => r.attendedHours > r.conductedHours);
    if (invalidAttend) {
      setError('Attended hours cannot exceed conducted hours for any subject.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    onSave(rows);
  };

  const clearAll = () => {
    setRows([defaultRow()]);
    localStorage.removeItem(STORAGE_KEY);
    setError('');
  };

  const computePct = (r: ManualSubject) =>
    r.conductedHours === 0 ? null : (r.attendedHours / r.conductedHours) * 100;

  const totalAttended = rows.reduce((s, r) => s + r.attendedHours, 0);
  const totalConducted = rows.reduce((s, r) => s + r.conductedHours, 0);
  const overallPct = totalConducted === 0 ? null : (totalAttended / totalConducted) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem' }}>
      <div style={{ background: 'var(--surface, #111827)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', maxWidth: '1000px', padding: '2rem', marginTop: '1rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#60a5fa' }}>✏️</span> Manual Subject & Attendance Entry
            </h2>
            <p style={{ margin: '0.4rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Enter your subjects, credit count, and attendance data. Data is saved locally.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        {/* Overall Preview */}
        {overallPct !== null && (
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>OVERALL ATTENDANCE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: overallPct >= 75 ? '#10b981' : '#ef4444' }}>{overallPct.toFixed(1)}%</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>TOTAL HOURS</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{totalAttended} / {totalConducted}</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>SUBJECTS</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{rows.length}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ background: overallPct >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${overallPct >= 75 ? '#10b981' : '#ef4444'}`, color: overallPct >= 75 ? '#10b981' : '#ef4444', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                {overallPct >= 75 ? '✓ Above 75%' : '⚠ Below 75%'}
              </span>
            </div>
          </div>
        )}

        {/* Per-Subject Percentage Preview */}
        {rows.some(r => r.conductedHours > 0) && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {rows.filter(r => r.conductedHours > 0).map((r, i) => {
              const pct = computePct(r)!;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${pct >= 75 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.code || r.name || `Subject ${i + 1}`}</span>
                  <span style={{ fontWeight: 700, color: pct >= 75 ? '#10b981' : '#ef4444' }}>{pct.toFixed(1)}%</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{r.attendedHours}/{r.conductedHours}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Subject Code *', 'Subject Name *', 'Credits', 'Attended (hrs)', 'Conducted (hrs)', 'Current %', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 0.75rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const pct = computePct(row);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        value={row.code}
                        onChange={e => updateRow(idx, 'code', e.target.value)}
                        placeholder="e.g. 21ECC201T"
                        style={{ width: '130px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        value={row.name}
                        onChange={e => updateRow(idx, 'name', e.target.value)}
                        placeholder="e.g. Solid State Devices"
                        style={{ width: '220px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        type="number" min={0} max={6} value={row.credits}
                        onChange={e => updateRow(idx, 'credits', e.target.value)}
                        style={{ width: '60px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        type="number" min={0} value={row.attendedHours}
                        onChange={e => updateRow(idx, 'attendedHours', e.target.value)}
                        style={{ width: '75px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${row.attendedHours > row.conductedHours ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, color: 'white', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        type="number" min={0} value={row.conductedHours}
                        onChange={e => updateRow(idx, 'conductedHours', e.target.value)}
                        style={{ width: '75px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.75rem', fontWeight: 700, color: pct === null ? 'rgba(255,255,255,0.3)' : pct >= 75 ? '#10b981' : '#ef4444', minWidth: '60px' }}>
                      {pct === null ? 'N/A' : `${pct.toFixed(1)}%`}
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <button
                        onClick={() => deleteRow(idx)}
                        disabled={rows.length === 1}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', opacity: rows.length === 1 ? 0.4 : 1, fontSize: '0.85rem' }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={addRow}
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}
            >
              + Add Subject
            </button>
            <input type="file" id="auto-fill-timetable" style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                try {
                  const { TesseractEngine } = await import('../utils/ocr/TesseractEngine');
                  const { HeuristicsParser } = await import('../utils/ocr/HeuristicsParser');
                  const engine = new TesseractEngine();
                  const rawText = await engine.extractText(e.target.files[0]);
                  const parser = new HeuristicsParser([]);
                  const periods = parser.parse(rawText);
                  
                  const uniqueSubjects = new Map<string, string>();
                  periods.forEach(p => {
                    if (p.subjectCode && p.subjectCode !== 'UNAVAILABLE') {
                      uniqueSubjects.set(p.subjectCode, p.subjectName || '');
                    }
                  });
                  
                  if (uniqueSubjects.size > 0) {
                    const newRows = Array.from(uniqueSubjects.entries()).map(([code, name]) => ({
                      code,
                      name,
                      credits: 3,
                      attendedHours: 0,
                      conductedHours: 0,
                    }));
                    setRows(newRows);
                    setError('');
                  } else {
                    setError('No subjects detected in timetable image.');
                  }
                } catch (err) {
                  setError('Failed to extract timetable data.');
                }
              }
            }} />
            <button
              onClick={() => document.getElementById('auto-fill-timetable')?.click()}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}
            >
              📸 Auto-Fill from Timetable
            </button>
            <button
              onClick={clearAll}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Clear All
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', color: 'white', padding: '0.6rem 1.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
            >
              ✓ Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to load saved manual subjects from localStorage
export function loadManualSubjects(): ManualSubject[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as ManualSubject[];
  } catch {}
  return null;
}

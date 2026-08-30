import React, { useState } from 'react';
import type { TimetablePeriod, Subject } from '@srm/shared';

interface TimetableReviewModalProps {
  initialPeriods: TimetablePeriod[];
  knownSubjects: Subject[];
  onConfirm: (periods: TimetablePeriod[]) => void;
  onCancel: () => void;
  onRescan: () => void;
}

export const TimetableReviewModal: React.FC<TimetableReviewModalProps> = ({ 
  initialPeriods,
  knownSubjects,
  onConfirm, 
  onCancel, 
  onRescan 
}) => {
  const [periods, setPeriods] = useState<TimetablePeriod[]>(initialPeriods);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (index: number, field: keyof TimetablePeriod, value: string | number) => {
    const newPeriods = [...periods];
    newPeriods[index] = { ...newPeriods[index], [field]: value };
    
    // Auto-fill subject details when one is selected
    if (field === 'subjectCode' && knownSubjects) {
      const selectedSub = knownSubjects.find(s => s.code === value);
      if (selectedSub) {
        newPeriods[index].subjectName = selectedSub.name;
      }
    }
    
    setPeriods(newPeriods);
    setError(null);
  };

  const handleDelete = (index: number) => {
    const newPeriods = periods.filter((_, i) => i !== index);
    setPeriods(newPeriods);
  };

  const handleAddRow = () => {
    const newPeriods = [...periods, { day: 'Monday', period: periods.length + 1, startTime: '08:00', endTime: '08:50', subjectCode: '', subjectName: '' }];
    setPeriods(newPeriods);
  };

  const handleGenerateTemplate = () => {
    const template: TimetablePeriod[] = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = [
      { start: '08:00', end: '08:50' },
      { start: '08:50', end: '09:40' },
      { start: '09:50', end: '10:40' },
      { start: '10:40', end: '11:30' },
      { start: '11:40', end: '12:30' },
    ];
    
    days.forEach(day => {
      times.forEach((t, i) => {
        template.push({ day, period: i + 1, startTime: t.start, endTime: t.end, subjectCode: '', subjectName: '' });
      });
    });
    setPeriods(template);
  };

  const validate = () => {
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      if (!p.day) return `Row ${i + 1}: Day is required.`;
      if (!p.startTime || !p.endTime) return `Row ${i + 1}: Time is required.`;
      if (!p.subjectCode || !p.subjectName) return `Row ${i + 1}: Subject is required.`;
    }
    return null;
  };

  const handleConfirm = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm(periods);
  };

  const validationError = validate();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '2rem', backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ 
        width: '100%', maxWidth: '1000px', maxHeight: '90vh', 
        overflowY: 'auto', position: 'relative',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--text-main)' }}>Review Parsed Timetable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Please review and correct the scanned results. Ensure start and end times are correct.</p>

        {error && <div style={{ color: '#f87171', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>Day</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>Period</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>Start</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>End</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>Code</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                <th style={{ padding: '0 0.5rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, idx) => (
                <tr key={idx} style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <td style={{ padding: '0.5rem', borderRadius: '6px 0 0 6px' }}>
                    <select 
                      value={p.day} 
                      onChange={(e) => handleUpdate(idx, 'day', e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input type="number" value={p.period} onChange={(e) => handleUpdate(idx, 'period', parseInt(e.target.value))} style={{ width: '60px', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input type="time" value={p.startTime} onChange={(e) => handleUpdate(idx, 'startTime', e.target.value)} style={{ width: '100px', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input type="time" value={p.endTime} onChange={(e) => handleUpdate(idx, 'endTime', e.target.value)} style={{ width: '100px', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input 
                      list={`subject-codes-${idx}`}
                      value={p.subjectCode} 
                      onChange={(e) => handleUpdate(idx, 'subjectCode', e.target.value)} 
                      style={{ width: '130px', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }}
                      placeholder="e.g. 21ECC203T"
                    />
                    <datalist id={`subject-codes-${idx}`}>
                      {knownSubjects.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </datalist>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input type="text" value={p.subjectName} onChange={(e) => handleUpdate(idx, 'subjectName', e.target.value)} style={{ width: '100%', minWidth: '180px', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px' }} placeholder="Subject Name" />
                  </td>
                  <td style={{ padding: '0.5rem', borderRadius: '0 6px 6px 0', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(idx)} style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Row">
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    No periods detected. Try adding a row manually or re-scanning the image.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleAddRow} style={{ padding: '0.6rem 1rem', cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '0.9rem' }}>＋ Add Row</button>
            <button onClick={handleGenerateTemplate} style={{ padding: '0.6rem 1rem', cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '0.9rem' }}>📄 Generate Template</button>
            <button onClick={onRescan} style={{ padding: '0.6rem 1rem', cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '0.9rem' }}>↻ Re-scan Image</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onCancel} style={{ padding: '0.6rem 1.5rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: '500' }}>Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={!!validationError}
              style={{ 
                padding: '0.6rem 1.5rem', 
                cursor: validationError ? 'not-allowed' : 'pointer', 
                background: validationError ? 'var(--text-muted)' : 'var(--text-color)', 
                color: 'var(--bg-card)', 
                borderRadius: '6px', 
                fontWeight: 'bold',
                border: 'none',
                opacity: validationError ? 0.5 : 1
              }}
            >
              ✓ Confirm Timetable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

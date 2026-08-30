import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  onClose: () => void;
  onSave: (newTarget: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave }) => {
  const [target, setTarget] = useState<number>(75);

  useEffect(() => {
    const saved = localStorage.getItem('bunk_adkirow_target');
    if (saved) {
      setTarget(parseFloat(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('bunk_adkirow_target', target.toString());
    onSave(target);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>⚙️ Settings</h2>
        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Customize your global attendance target.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Target Attendance (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="range" 
              min="50" max="100" step="1" 
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
            <span style={{ 
              fontWeight: 700, fontSize: '1.25rem', color: target >= 75 ? 'var(--status-safe)' : 'var(--status-watch)',
              minWidth: '3.5rem', textAlign: 'right'
            }}>
              {target}%
            </span>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            Default is 75%. All safe misses and recovery plans will be calculated based on this target.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '6px',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              background: 'var(--primary)', border: 'none',
              color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px',
              cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
            }}
          >
            Save Target
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ServerCrash, Plug } from 'lucide-react';

interface EmptyStateProps {
  type: 'INITIAL' | 'UNAVAILABLE';
  onConnect: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onConnect }) => {
  return (
    <div className="empty-state">
      {type === 'INITIAL' ? (
        <>
          <img src="/logo.png" alt="Bunk Adkirow Logo" style={{ width: '80px', height: '80px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(59,130,246,0.3)', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Bunk Adkirow</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Your Attendance Decision Assistant</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>"Attendance-a guess pannama, smart-ah plan pannu."</p>
          <button className="primary-btn" onClick={onConnect} style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plug size={18} /> Connect to SRMIST
          </button>
        </>
      ) : (
        <>
          <ServerCrash size={48} className="icon-error" />
          <h2>Attendance data unavailable</h2>
          <p>Please reconnect to SRMIST and try again.</p>
          <button className="primary-btn" onClick={onConnect}>Reconnect</button>
        </>
      )}
    </div>
  );
};

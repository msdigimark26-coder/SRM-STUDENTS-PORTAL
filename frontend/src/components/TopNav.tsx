import React from 'react';
import { Wifi, WifiOff, LogOut, Activity, Bot, Calendar, DoorOpen, Scale, Zap, GraduationCap } from 'lucide-react';
import type { ConnectionState } from '@srm/shared';

export type TabType = 'health' | 'calendar' | 'leave' | 'whatif' | 'priority' | 'ai' | 'academic';

interface TopNavProps {
  connectionState: ConnectionState;
  onDisconnect: () => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  isManualMode?: boolean;
  onOpenSettings?: () => void;
}

const NAV_ITEMS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'health', label: 'Attendance Health', icon: <Activity size={16} /> },
  { id: 'ai', label: 'AI Agent', icon: <Bot size={16} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
  { id: 'leave', label: 'Can I Take Leave?', icon: <DoorOpen size={16} /> },
  { id: 'whatif', label: 'What If?', icon: <Scale size={16} /> },
  { id: 'priority', label: 'Credit Priorities', icon: <Zap size={16} /> },
  { id: 'academic', label: 'Academic', icon: <GraduationCap size={16} /> },
];

export const TopNav: React.FC<TopNavProps> = ({ connectionState, onDisconnect, activeTab, onTabChange, isManualMode, onOpenSettings: _onOpenSettings }) => {
  const isConnected = connectionState === 'DATA_READY';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9,12,21,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 'var(--nav-height)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <img src="/logo.png" alt="Bunk Adkirow" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '8px' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-main)' }}>
              Bunk Adkirow
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Attendance Decision Assistant
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        {isConnected && onTabChange && (
          <nav style={{ display: 'none', alignItems: 'center', gap: '0.25rem', flex: 1 }} className="desktop-nav" aria-label="Main navigation">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
                style={{
                  background: activeTab === item.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: activeTab === item.id ? 'var(--primary)' : 'var(--text-muted)',
                  border: activeTab === item.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === item.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  minHeight: '36px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Connection status dot */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: isConnected ? 'rgba(16,185,129,0.1)' : isManualMode ? 'rgba(59,130,246,0.1)' : 'rgba(71,85,105,0.1)',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.2)' : isManualMode ? 'rgba(59,130,246,0.2)' : 'rgba(71,85,105,0.2)'}`,
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isConnected ? 'var(--status-safe)' : isManualMode ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span style={{ display: 'none' }} className="status-text">
              {isConnected ? 'Connected' : isManualMode ? 'Manual Mode' : 'Offline'}
            </span>
          </div>

          {isConnected && (
            <button
              onClick={onDisconnect}
              aria-label="Disconnect from SRMIST"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: 'var(--status-risk)',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                minHeight: '36px',
              }}
            >
              <LogOut size={14} />
              <span className="disconnect-text">Disconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop nav inline styles (show on >= 768px) */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .status-text { display: inline !important; }
          .disconnect-text { display: inline !important; }
        }
        @media (max-width: 767px) {
          .disconnect-text { display: none !important; }
        }
      `}</style>
    </header>
  );
};

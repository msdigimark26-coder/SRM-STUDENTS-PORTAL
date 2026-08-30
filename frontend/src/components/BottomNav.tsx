import React from 'react';
import type { TabType } from './TopNav';

import { Activity, Bot, Calendar, Map, Zap, GraduationCap } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  show: boolean;
}

const BOTTOM_ITEMS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'health',   label: 'Health',   icon: <Activity size={22} /> },
  { id: 'ai',       label: 'AI',       icon: <Bot size={22} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={22} /> },
  { id: 'leave',    label: 'Plan',     icon: <Map size={22} /> },
  { id: 'academic', label: 'Academic', icon: <GraduationCap size={22} /> },
  { id: 'priority', label: 'Credits',  icon: <Zap size={22} /> },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, show }) => {
  if (!show) return null;

  return (
    <>
      {/* Only shown on mobile */}
      <style>{`
        .bottom-nav {
          display: flex;
        }
        @media (min-width: 768px) {
          .bottom-nav { display: none !important; }
        }
        .bottom-nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.6rem 0.25rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, color 0.2s ease;
          min-height: 64px;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }
        .bottom-nav-btn:active {
          transform: scale(0.92);
        }
        .bottom-nav-btn .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          margin-bottom: 2px;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bottom-nav-btn.active .nav-icon {
          transform: scale(1.18) translateY(-2px);
        }
        .bottom-nav-btn .nav-label {
          font-size: 0.67rem;
          letter-spacing: 0.01em;
          font-weight: 400;
          transition: font-weight 0.15s ease;
        }
        .bottom-nav-btn.active .nav-label {
          font-weight: 700;
        }
        .bottom-nav-btn .active-dot {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .bottom-nav-btn.active .active-dot {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
        .bottom-nav-btn .active-bg {
          position: absolute;
          inset: 6px 4px;
          border-radius: 10px;
          background: rgba(59,130,246,0.1);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .bottom-nav-btn.active .active-bg {
          opacity: 1;
        }
      `}</style>
      <nav
        className="bottom-nav"
        aria-label="Bottom navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'rgba(9,12,21,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          justifyContent: 'space-around',
          alignItems: 'stretch',
        }}
      >
        {BOTTOM_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`bottom-nav-btn${isActive ? ' active' : ''}`}
              style={{
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <div className="active-bg" />
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <div className="active-dot" />
            </button>
          );
        })}
      </nav>
    </>
  );
};

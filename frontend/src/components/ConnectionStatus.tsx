import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'INITIAL' | 'CONNECTING' | 'UNAVAILABLE' | 'DASHBOARD';
  onDisconnect: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onDisconnect }) => {
  return (
    <div className="connection-header">
      <div className="app-title">
        <div className={`status-indicator ${status.toLowerCase()}`}>
          {status === 'DASHBOARD' ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>
        <h1>Attendance Health</h1>
      </div>
      {status === 'DASHBOARD' && (
        <button className="secondary-btn" onClick={onDisconnect}>
          Disconnect
        </button>
      )}
    </div>
  );
};

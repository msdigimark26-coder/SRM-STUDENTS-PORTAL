import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { NormalizedStudentData } from '@srm/shared';

interface AttendanceTrendGraphProps {
  studentData: NormalizedStudentData;
  targetPct: number;
}

export const AttendanceTrendGraph: React.FC<AttendanceTrendGraphProps> = ({ studentData, targetPct }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate 7 days of mock historical data trailing up to current overall percentage
  let totalAttended = 0;
  let totalConducted = 0;
  
  studentData.attendance.forEach(sub => {
    totalAttended += sub.attendedHours;
    totalConducted += sub.conductedHours;
  });
  
  const currentOverall = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
  
  // Mock data points (last 7 weeks/days)
  const dataPoints = [
    Math.max(0, currentOverall - 4.2),
    Math.max(0, currentOverall - 2.8),
    Math.max(0, currentOverall - 1.1),
    Math.max(0, currentOverall + 0.5),
    Math.max(0, currentOverall + 1.2),
    Math.max(0, currentOverall - 0.4),
    currentOverall
  ];

  const minVal = Math.min(...dataPoints, targetPct - 5) - 2;
  const maxVal = Math.max(...dataPoints, targetPct + 5) + 2;
  const range = maxVal - minVal;

  const width = 100; // viewbox percentage
  const height = 40; // viewbox percentage

  const getCoordinates = (val: number, index: number) => {
    const x = (index / (dataPoints.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    return `${x},${y}`;
  };

  const polylinePoints = dataPoints.map((val, idx) => getCoordinates(val, idx)).join(' ');
  const targetY = height - ((targetPct - minVal) / range) * height;

  return (
    <div className="card-glass" style={{ padding: '1.5rem 2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--primary)" /> Attendance Trend
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Past 7 days trajectory</p>
        </div>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 800, 
          color: currentOverall >= targetPct ? 'var(--status-safe)' : 'var(--status-risk)',
          textShadow: `0 0 20px ${currentOverall >= targetPct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}>
          {currentOverall.toFixed(1)}%
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '120px', marginTop: '0.5rem' }}>
        <svg viewBox={`0 -10 100 ${height + 20}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
          
          {/* Target Line */}
          <line 
            x1="0" y1={targetY} x2="100" y2={targetY} 
            stroke="var(--border-active)" strokeWidth="0.5" strokeDasharray="3, 3" 
          />
          <text x="100" y={targetY - 3} fill="var(--text-muted)" fontSize="3.5" fontWeight="500" textAnchor="end" letterSpacing="0.05em">TARGET {targetPct}%</text>

          {/* Gradient fill */}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Area under the line */}
          <polygon 
            points={`0,${height + 10} ${polylinePoints} 100,${height + 10}`} 
            fill="url(#trendGradient)"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 1s ease'
            }}
          />

          {/* The line itself */}
          <polyline
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            filter="url(#glow)"
            style={{
              strokeDasharray: '400',
              strokeDashoffset: mounted ? '0' : '400',
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {/* Data points */}
          {dataPoints.map((val, idx) => {
            const [x, y] = getCoordinates(val, idx).split(',');
            const isTargetMet = val >= targetPct;
            return (
              <g key={idx} style={{
                opacity: mounted ? 1 : 0,
                transition: `opacity 0.3s ease ${1.5 * (idx / dataPoints.length)}s, transform 0.2s`
              }}>
                <circle 
                  cx={x} cy={y} r="1.5" 
                  fill={isTargetMet ? 'var(--status-safe)' : 'var(--status-risk)'} 
                  stroke="var(--bg-card)" 
                  strokeWidth="0.8" 
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

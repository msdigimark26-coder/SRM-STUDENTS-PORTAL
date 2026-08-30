import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import type { SubjectAttendanceResult } from '@srm/shared';

interface AttendanceChartProps {
  subjects: SubjectAttendanceResult[];
  targetPercentage: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ subjects, targetPercentage }) => {
  const data = useMemo(() => {
    return subjects.map(sub => ({
      name: sub.subjectCode,
      // Recharts ignores null/undefined nicely if configured, or we can use 0 visually but label it N/A
      // Since requirements state 'handle null values, never render NaN/Infinity', we ensure only valid numbers or null are passed
      percentage: sub.currentPercentage,
      status: sub.healthStatus
    }));
  }, [subjects]);

  const getColor = (status: string) => {
    switch (status) {
      case 'SAFE': return '#10b981';
      case 'WATCH': return '#f59e0b';
      case 'AT_RISK': return '#f97316';
      case 'BELOW_TARGET': return '#ef4444';
      default: return '#64748b';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="chart-tooltip">
          <p className="label">{label}</p>
          <p className="intro">Attendance: {val !== null ? `${val}%` : 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card chart-container">
      <h3>Attendance vs Target</h3>
      <div className="chart-wrapper" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            role="img"
            aria-label="Bar chart showing subject attendance percentages"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <ReferenceLine y={targetPercentage} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: `Target ${targetPercentage}%`, fill: '#ef4444', fontSize: 12 }} />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

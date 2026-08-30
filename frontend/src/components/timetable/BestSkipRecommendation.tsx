import React from 'react';
import type { TimetablePeriod, NormalizedStudentData } from '@srm/shared';
import { simulateAttendance } from '@srm/shared';

interface BestSkipRecommendationProps {
  remainingClasses: TimetablePeriod[];
  studentData: NormalizedStudentData;
}

export const BestSkipRecommendation: React.FC<BestSkipRecommendationProps> = ({ remainingClasses, studentData }) => {
  if (remainingClasses.length === 0) {
    return null;
  }

  const recommendations = remainingClasses.map(cls => {
    const subjectRecord = studentData.attendance.find(a => a.subjectCode === cls.subjectCode);
    if (!subjectRecord) return null;

    const current = { attended: subjectRecord.attendedHours, conducted: subjectRecord.conductedHours };
    const currentPercentage = current.conducted > 0 ? (current.attended / current.conducted) * 100 : 0;
    const ifMissed = simulateAttendance({ current, changes: { miss: 1 } });

    // The buffer is how far the new percentage is above the target (75%)
    const buffer = ifMissed.percentage - 75;

    return {
      cls,
      currentPercentage,
      ifMissed,
      buffer,
      status: ifMissed.status
    };
  }).filter(r => r !== null) as Array<{
    cls: TimetablePeriod,
    currentPercentage: number,
    ifMissed: ReturnType<typeof simulateAttendance>,
    buffer: number,
    status: string
  }>;

  if (recommendations.length === 0) return null;

  // Rank by buffer (highest buffer is best to skip)
  recommendations.sort((a, b) => b.buffer - a.buffer);

  const bestOption = recommendations[0];

  return (
    <div className="card" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'transparent' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>⭐</span> Best Class to Skip
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
          BEST OPTIONS TODAY
        </p>
        
        {recommendations.map((rec, idx) => {
          const icon = rec.status === 'SAFE' || rec.status === 'WATCH' ? '🟢' : rec.status === 'AT_RISK' ? '🟠' : '🔴';
          return (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <div>{icon}</div>
              <div style={{ fontWeight: 500 }}>{rec.cls.subjectName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {rec.currentPercentage.toFixed(1)}% → {rec.ifMissed.percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '8px' }}>
        <strong>Recommended:</strong> If you absolutely need to miss one period, <strong>{bestOption.cls.subjectName}</strong> has the largest buffer.
      </div>
    </div>
  );
};

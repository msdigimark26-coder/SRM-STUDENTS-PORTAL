import React from 'react';

interface QuickInsightCardProps {
  title: string;
  value: number | string | null;
  suffix?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}

export const QuickInsightCard: React.FC<QuickInsightCardProps> = ({ 
  title, 
  value, 
  suffix = '',
  highlight = 'neutral'
}) => {
  let displayValue: React.ReactNode = value;
  
  if (value === null) {
    displayValue = <span className="unavailable">N/A</span>;
  } else if (value === Infinity) {
    displayValue = <span className="unavailable">Not reachable</span>;
  } else {
    displayValue = `${value}${suffix}`;
  }

  return (
    <div className={`insight-card card highlight-${highlight}`}>
      <h3 className="insight-title">{title}</h3>
      <div className="insight-value">{displayValue}</div>
    </div>
  );
};

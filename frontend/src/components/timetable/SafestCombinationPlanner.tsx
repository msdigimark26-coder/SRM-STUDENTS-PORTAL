import React, { useState, useMemo } from 'react';
import type { NormalizedStudentData, TimetablePeriod } from '@srm/shared';
import { determineHealthStatus } from '@srm/shared';

interface SafestCombinationPlannerProps {
  studentData: NormalizedStudentData;
  todaysClasses: TimetablePeriod[];
}

export const SafestCombinationPlanner: React.FC<SafestCombinationPlannerProps> = ({ studentData, todaysClasses }) => {
  const [missCount, setMissCount] = useState<number>(2);

  const getCombinations = (array: TimetablePeriod[], k: number): TimetablePeriod[][] => {
    if (k === 0) return [[]];
    if (array.length === 0) return [];
    
    const [first, ...rest] = array;
    const withFirst = getCombinations(rest, k - 1).map(comb => [first, ...comb]);
    const withoutFirst = getCombinations(rest, k);
    
    return [...withFirst, ...withoutFirst];
  };

  const evaluatedCombinations = useMemo(() => {
    if (todaysClasses.length === 0 || missCount > todaysClasses.length || missCount <= 0) return { safe: [], avoid: [] };

    const combinations = getCombinations(todaysClasses, missCount);
    
    // Baseline overall attendance
    let totalAttended = 0;
    let totalConducted = 0;
    studentData.attendance.forEach(record => {
      totalAttended += record.attendedHours;
      totalConducted += record.conductedHours;
    });

    const evaluated = combinations.map(comb => {
      const missCountsBySubject: Record<string, number> = {};
      comb.forEach(p => {
        missCountsBySubject[p.subjectCode] = (missCountsBySubject[p.subjectCode] || 0) + 1;
      });

      let anySubjectBelowTarget = false;
      let overallStatus = 'SAFE';

      // Evaluate subjects
      Object.keys(missCountsBySubject).forEach(subjectCode => {
        const record = studentData.attendance.find(a => a.subjectCode === subjectCode);
        if (record) {
          const missed = missCountsBySubject[subjectCode];
          const projConducted = record.conductedHours + missed;
          const projPercentage = projConducted > 0 ? (record.attendedHours / projConducted) * 100 : 0;
          if (projPercentage < 75) {
            anySubjectBelowTarget = true;
          }
        }
      });

      const projectedConducted = totalConducted + missCount;
      const projectedPercentage = projectedConducted > 0 ? (totalAttended / projectedConducted) * 100 : 0;
      
      const status = determineHealthStatus(projectedPercentage, 75, 5, 5);
      if (status === 'BELOW_TARGET') {
        overallStatus = 'DANGER';
      } else if (status === 'AT_RISK') {
        overallStatus = 'WATCH';
      }

      // Formatting name
      const title = comb.map(c => c.subjectName).join(' + ');
      
      const isSafe = !anySubjectBelowTarget && overallStatus !== 'DANGER';

      return {
        title,
        projectedPercentage,
        overallStatus,
        anySubjectBelowTarget,
        isSafe,
        missCountsBySubject
      };
    });

    // Sort by projected percentage descending
    evaluated.sort((a, b) => b.projectedPercentage - a.projectedPercentage);

    // Group combinations with the EXACT same title to prevent spamming "DBMS + DBMS" 
    const uniqueEvaluated: typeof evaluated = [];
    const seenTitles = new Set<string>();
    evaluated.forEach(e => {
      // Sort the title components alphabetically so "OS + DBMS" is the same as "DBMS + OS"
      const normalizedTitle = e.title.split(' + ').sort().join(' + ');
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueEvaluated.push({ ...e, title: normalizedTitle });
      }
    });

    return {
      safe: uniqueEvaluated.filter(e => e.isSafe).slice(0, 3), // Top 3 safe
      avoid: uniqueEvaluated.filter(e => !e.isSafe).slice(-3).reverse() // Bottom 3 avoid
    };

  }, [todaysClasses, missCount, studentData]);

  if (todaysClasses.length < 2) return null; // Needs at least 2 classes to be useful

  return (
    <div className="card" style={{ border: '2px solid var(--border-color)', backgroundColor: 'transparent' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span>⚖️</span> SAFEST COMBINATION
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
          I need to miss classes today:
        </label>
        <select 
          value={missCount} 
          onChange={e => setMissCount(Number(e.target.value))}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-color)', fontSize: '1rem' }}
        >
          {Array.from({ length: todaysClasses.length - 1 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'class' : 'classes'}</option>
          ))}
        </select>
      </div>

      {evaluatedCombinations.safe.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>SAFE OPTIONS</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#22c55e', opacity: 0.2 }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evaluatedCombinations.safe.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--bg-card-hover)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{opt.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Projected: {opt.projectedPercentage.toFixed(1)}% <span style={{ marginLeft: '0.25rem' }}>{opt.overallStatus === 'WATCH' ? '🟠' : '🟢'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {evaluatedCombinations.avoid.length > 0 && (
        <div>
          <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>AVOID</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#ef4444', opacity: 0.2 }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evaluatedCombinations.avoid.map((opt, idx) => {
              
              // Figure out exactly WHY we should avoid this
              const avoidReasons: string[] = [];
              if (opt.overallStatus === 'DANGER') avoidReasons.push(`Drops overall below 75%`);
              Object.keys(opt.missCountsBySubject).forEach(subjectCode => {
                const record = studentData.attendance.find(a => a.subjectCode === subjectCode);
                const subjectName = studentData.subjects.find(s => s.code === subjectCode)?.name || subjectCode;
                if (record) {
                  const p = (record.attendedHours / (record.conductedHours + opt.missCountsBySubject[subjectCode])) * 100;
                  if (p < 75) {
                    avoidReasons.push(`Drops ${subjectName} to ${p.toFixed(1)}%`);
                  }
                }
              });

              return (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.25rem' }}>❌</div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{opt.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Projected: {opt.projectedPercentage.toFixed(1)}% <span style={{ marginLeft: '0.25rem' }}>🔴</span>
                    </div>
                    {avoidReasons.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                        {avoidReasons.map((r, i) => <div key={i}>• {r}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

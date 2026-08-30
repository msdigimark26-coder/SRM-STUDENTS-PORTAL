import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import type { AgentResponse, AgentCard } from './AgentOrchestrator';

// Simple fuzzy match — checks if message contains part of a subject name
function findSubjectByName(message: string, names: string[]): string | null {
  const lower = message.toLowerCase();
  // Try longest match first
  const sorted = [...names].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const words = name.toLowerCase().split(/\s+/);
    // Match if any meaningful word (> 2 chars) from the subject name appears in the message
    if (words.some(w => w.length > 2 && lower.includes(w))) return name;
  }
  return null;
}

export const RecoveryAgent = {
  respond(message: string, studentData: NormalizedStudentData): AgentResponse {
    const engine  = new AttendanceEngine();
    const results = engine.processSubjects(studentData.subjects, studentData.attendance);
    const target  = (engine as any).config.targetPercentage as number;

    const subjectNames = results.map(r => r.subjectName);
    const matchedName  = findSubjectByName(message, subjectNames);

    // If a specific subject is mentioned, focus on it
    if (matchedName) {
      const sub = results.find(r => r.subjectName === matchedName)!;
      const recovery = engine.calculateRecoveryHours(sub.attendedHours, sub.conductedHours) ?? 0;
      const pct = sub.currentPercentage ?? 0;

      if (recovery === 0) {
        return {
          text: `✅ **${sub.subjectName}** already at ${pct}% — target-ku mela irukku! No recovery needed.\n\nSafe misses: **${sub.safeAbsenceHours ?? 0}** more.`,
          agentType: 'recovery',
          cards: [{
            type: 'stat', title: sub.subjectName,
            value: `${pct}%`, status: 'safe', icon: '🟢',
            subtitle: `${sub.attendedHours}/${sub.conductedHours} hrs`,
          }],
        };
      }

      // Build a simulated recovery calendar
      const sessionDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const today = new Date();
      const recoverySteps: { date: string; label: string }[] = [];
      let dayOffset = 1;

      for (let i = 0; i < recovery && dayOffset <= 60; dayOffset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + dayOffset);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (sessionDays.includes(dayName)) {
          recoverySteps.push({
            date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            label: `Period ${(i % 3) + 1}`,
          });
          i++;
        }
      }

      const targetDate = recoverySteps[recoverySteps.length - 1]?.date ?? 'soon';

      const text =
        `**${sub.subjectName} Recovery Plan**\n\n` +
        `Current: **${pct}%** (Target: ${target}%)\n` +
        `You need to attend **${recovery} more classes** consecutively.\n\n` +
        `✅ Target achieved by: **${targetDate}**`;

      const cards: AgentCard[] = [
        {
          type: 'stat', title: 'Classes Needed',
          value: `${recovery}`, status: 'risk',
          icon: '📚', subtitle: `Attend continuously to hit ${target}%`,
        },
        ...recoverySteps.map((step, i) => ({
          type: 'recovery-step' as const,
          title: step.date,
          subtitle: step.label,
          value: `Class ${i + 1}/${recovery}`,
          status: (i === recovery - 1 ? 'safe' : 'info') as AgentCard['status'],
          icon: i === recovery - 1 ? '🏁' : '📖',
        })),
      ];

      return { text, agentType: 'recovery', cards };
    }

    // No specific subject — list ALL below-target subjects
    const belowTarget = results.filter(r =>
      (r.currentPercentage ?? 0) < target && r.conductedHours > 0
    );

    if (belowTarget.length === 0) {
      return {
        text: `🎉 All subjects are at or above ${target}%! No recovery needed machan!\n\nKeep it up! 💪`,
        agentType: 'recovery',
      };
    }

    const text =
      `🔴 **${belowTarget.length} subject${belowTarget.length > 1 ? 's' : ''} below ${target}%** — Recovery needed!\n\n` +
      belowTarget.map(r => {
        const rec = r.recoveryHours ?? 0;
        return `• **${r.subjectName}**: ${r.currentPercentage}% — Attend ${rec} more classes`;
      }).join('\n') +
      `\n\nSpecific subject-ku recovery path venum-na, name sollvidu! (e.g., "Recover DLD")`;

    const cards: AgentCard[] = belowTarget.map(r => ({
      type: 'subject-row' as const,
      title: r.subjectName,
      subtitle: `${r.currentPercentage}%  •  ${r.attendedHours}/${r.conductedHours} hrs`,
      value: `Attend ${r.recoveryHours ?? 0} more`,
      status: 'risk' as AgentCard['status'],
      icon: '🔴',
    }));

    return { text, agentType: 'recovery', cards };
  },
};

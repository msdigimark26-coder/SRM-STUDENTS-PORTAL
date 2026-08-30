import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import type { AgentResponse, AgentCard, CardStatus } from './AgentOrchestrator';

const STATUS_ICON: Record<string, string> = {
  SAFE: '🟢',
  WATCH: '🟡',
  AT_RISK: '🟠',
  BELOW_TARGET: '🔴',
  UNAVAILABLE: '⚪',
};

const STATUS_MAP: Record<string, CardStatus> = {
  SAFE: 'safe',
  WATCH: 'watch',
  AT_RISK: 'risk',
  BELOW_TARGET: 'risk',
  UNAVAILABLE: 'unavailable',
};

export const AttendanceAgent = {
  respond(_message: string, studentData: NormalizedStudentData): AgentResponse {
    const engine = new AttendanceEngine();
    const results = engine.processSubjects(studentData.subjects, studentData.attendance);
    const target = (engine as any).config.targetPercentage as number;

    // Overall stats
    let totalAttended = 0;
    let totalConducted = 0;
    results.forEach(r => {
      totalAttended += r.attendedHours;
      totalConducted += r.conductedHours;
    });

    const overallPct = totalConducted > 0
      ? (totalAttended / totalConducted) * 100
      : 0;

    const safeCount  = results.filter(r => r.healthStatus === 'SAFE').length;
    const watchCount = results.filter(r => r.healthStatus === 'WATCH').length;
    const riskCount  = results.filter(r => r.healthStatus === 'AT_RISK' || r.healthStatus === 'BELOW_TARGET').length;

    // Overall status emoji
    let overallEmoji = '🟢';
    let overallVerdict = 'Nalla irukku machan! 🎉';
    if (overallPct < target) {
      overallEmoji = '🔴';
      overallVerdict = `Target ${target}% miss aachu! Recovery venum.`;
    } else if (overallPct < target + 5) {
      overallEmoji = '🟡';
      overallVerdict = 'Watch zone-la irukku. Careful ah iru.';
    }

    const text =
      `${overallEmoji} **Overall Attendance: ${overallPct.toFixed(1)}%** (Target: ${target}%)\n\n` +
      `${overallVerdict}\n\n` +
      `🟢 ${safeCount} Safe  |  🟡 ${watchCount} Watch  |  🔴 ${riskCount} Risk\n\n` +
      `Intha subject-wise breakdown paaru 👇`;

    const cards: AgentCard[] = results.map(r => {
      const pct = r.currentPercentage ?? 0;
      const safe = r.safeAbsenceHours ?? 0;
      const rec  = r.recoveryHours ?? 0;
      const icon = STATUS_ICON[r.healthStatus] ?? '⚪';
      const status = STATUS_MAP[r.healthStatus] ?? 'unavailable';

      let badge = '';
      if (safe > 0)  badge = `+${safe} safe misses`;
      else if (rec > 0) badge = `Attend ${rec} more`;
      else             badge = 'On target';

      return {
        type: 'subject-row',
        title: r.subjectName,
        subtitle: `${pct}%  •  ${r.attendedHours}/${r.conductedHours} hrs`,
        value: badge,
        status,
        icon,
      } as AgentCard;
    });

    return { text, agentType: 'attendance', cards };
  },
};

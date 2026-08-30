import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import type { AgentResponse, AgentCard } from './AgentOrchestrator';

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function extractTargetDay(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('today')) {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (lower.includes('tomorrow')) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  for (const day of DAYS) {
    if (lower.includes(day)) return day.charAt(0).toUpperCase() + day.slice(1);
  }
  // Default to tomorrow
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export const LeaveDecisionAgent = {
  respond(message: string, studentData: NormalizedStudentData): AgentResponse {
    const engine   = new AttendanceEngine();
    const results  = engine.processSubjects(studentData.subjects, studentData.attendance);
    const target   = (engine as any).config.targetPercentage as number;
    const targetDay = extractTargetDay(message);

    // Get timetable sessions for that day
    let scheduledClasses: { subjectCode: string; subjectName?: string; period?: number; startTime: string }[] = [];
    if (studentData.timetable?.sessions) {
      scheduledClasses = studentData.timetable.sessions.filter(
        s => s.day.toLowerCase() === targetDay.toLowerCase()
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    if (scheduledClasses.length === 0) {
      if (!studentData.timetable) {
        return {
          text: `Machan, you haven't uploaded your timetable yet!\nUpload it now so I can simulate a leave for ${targetDay}.`,
          agentType: 'leave',
          cards: [{
            type: 'timetable-upload' as any,
            title: 'Upload Timetable',
            status: 'info'
          }]
        };
      }
      return {
        text: `${targetDay}-la classes illai machan! 🎉 Free day — enjoy pannu!\n\n(If you uploaded a timetable, check if ${targetDay} has sessions.)`,
        agentType: 'leave',
      };
    }

    // Current overall
    let totalAttended = 0;
    let totalConducted = 0;
    results.forEach(r => { totalAttended += r.attendedHours; totalConducted += r.conductedHours; });
    const currentOverall = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

    // Project full-day leave impact
    const projectedAttended  = totalAttended;
    const projectedConducted = totalConducted + scheduledClasses.length;
    const projectedOverall   = (projectedAttended / projectedConducted) * 100;
    const delta              = projectedOverall - currentOverall;

    // Per-subject impact
    const subjectCounts = new Map<string, number>();
    scheduledClasses.forEach(cls => {
      subjectCounts.set(cls.subjectCode, (subjectCounts.get(cls.subjectCode) || 0) + 1);
    });

    const riskIfLeave: string[] = [];
    const safeToMiss:  string[] = [];

    results.forEach(r => {
      const count = subjectCounts.get(r.subjectCode) || 0;
      if (count === 0) return;
      const safeMiss = engine.calculateSafeAbsence(r.attendedHours, r.conductedHours) ?? 0;
      if (safeMiss >= count) {
        safeToMiss.push(r.subjectName);
      } else {
        riskIfLeave.push(r.subjectName);
      }
    });

    const verdict = riskIfLeave.length === 0
      ? '✅ FULL DAY LEAVE — Safe!'
      : safeToMiss.length > 0
        ? '⚠️ PARTIAL LEAVE — Recommended'
        : '🚨 NO LEAVE — Attendance risk high!';

    let text =
      `**${targetDay} — ${scheduledClasses.length} classes scheduled**\n\n` +
      `Current Overall: **${currentOverall.toFixed(1)}%**\n` +
      `If you miss ALL ${scheduledClasses.length} → **${projectedOverall.toFixed(1)}%** (${delta.toFixed(1)}%)\n\n` +
      `**${verdict}**\n\n`;

    if (riskIfLeave.length > 0) {
      text += `⚠️ Risk subjects (attend these):\n${riskIfLeave.map(s => `  • ${s}`).join('\n')}\n\n`;
    }
    if (safeToMiss.length > 0 && riskIfLeave.length > 0) {
      text += `✅ Safe to miss:\n${safeToMiss.map(s => `  • ${s}`).join('\n')}`;
    }
    if (riskIfLeave.length === 0) {
      text += `All ${safeToMiss.length} subjects have enough buffer. Go enjoy machan! 🎉`;
    }

    // Cards: one per scheduled subject
    const cards: AgentCard[] = [];

    // Full-day impact stat cards
    cards.push({
      type: 'stat',
      title: 'Current Overall',
      value: `${currentOverall.toFixed(1)}%`,
      status: currentOverall >= target ? 'safe' : 'risk',
      icon: 'BarChart2',
    });
    cards.push({
      type: 'stat',
      title: `After ${targetDay} Leave`,
      value: `${projectedOverall.toFixed(1)}%`,
      status: projectedOverall >= target ? 'safe' : projectedOverall >= target - 5 ? 'watch' : 'risk',
      icon: delta < 0 ? 'TrendingDown' : 'TrendingUp',
      badge: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
    });

    // Per-subject rows
    results.forEach(r => {
      const count = subjectCounts.get(r.subjectCode) || 0;
      if (count === 0) return;
      const safeMiss = engine.calculateSafeAbsence(r.attendedHours, r.conductedHours) ?? 0;
      const isRisk = safeMiss < count;
      cards.push({
        type: 'subject-row',
        title: r.subjectName,
        subtitle: `${r.currentPercentage}%  •  ${count} class${count > 1 ? 'es' : ''} today`,
        value: isRisk ? '⚠ Attend!' : `${safeMiss} safe misses`,
        status: isRisk ? 'risk' : 'safe',
        icon: isRisk ? '🔴' : '🟢',
      });
    });

    return { text, agentType: 'leave', cards };
  },
};

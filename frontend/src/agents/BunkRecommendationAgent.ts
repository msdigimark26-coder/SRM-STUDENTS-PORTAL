import type { NormalizedStudentData } from '@srm/shared';
import { AttendanceEngine } from '../engines/AttendanceEngine';
import type { AgentResponse, AgentCard } from './AgentOrchestrator';

export const BunkRecommendationAgent = {
  respond(_message: string, studentData: NormalizedStudentData): AgentResponse {
    const engine = new AttendanceEngine();
    const results = engine.processSubjects(studentData.subjects, studentData.attendance);

    // Get today's classes
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let scheduledClasses: { subjectCode: string; subjectName?: string; startTime: string }[] = [];
    if (studentData.timetable?.sessions) {
      scheduledClasses = studentData.timetable.sessions.filter(
        s => s.day.toLowerCase() === todayStr.toLowerCase()
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    if (scheduledClasses.length === 0) {
      if (!studentData.timetable) {
        return {
          text: `Machan, you haven't uploaded your timetable yet!\nUpload it now so I can tell you which classes are safe to bunk today.`,
          agentType: 'bunk',
          cards: [{
            type: 'timetable-upload' as any,
            title: 'Upload Timetable',
            status: 'info'
          }]
        };
      }
      return {
        text: `Today is **${todayStr}**. No classes scheduled! 🎉\nEnjoy your free day!`,
        agentType: 'bunk',
      };
    }

    // Rank subjects by safe absence capacity
    const availableToBunk = new Map<string, { name: string, count: number, safeMiss: number }>();

    scheduledClasses.forEach(cls => {
      const sub = results.find(r => r.subjectCode === cls.subjectCode);
      if (!sub) return;

      const safeMiss = engine.calculateSafeAbsence(sub.attendedHours, sub.conductedHours) ?? 0;
      const existing = availableToBunk.get(cls.subjectCode);
      if (existing) {
        existing.count += 1;
      } else {
        availableToBunk.set(cls.subjectCode, { name: sub.subjectName, count: 1, safeMiss });
      }
    });

    const ranked = Array.from(availableToBunk.values())
      .map(item => ({
        ...item,
        score: item.safeMiss - item.count, // How many extra safe misses exist beyond today's requirement
      }))
      .sort((a, b) => b.score - a.score);

    const safeOptions = ranked.filter(r => r.score >= 0);
    const riskyOptions = ranked.filter(r => r.score < 0);

    let text = `**Today's Bunk Analysis (${todayStr})**\n\n`;

    if (safeOptions.length > 0) {
      text += `✅ **Safe to Bunk:**\n`;
      safeOptions.forEach((r, idx) => {
        text += `${idx + 1}. **${r.name}** (${r.count} class${r.count > 1 ? 'es' : ''}) — ${r.safeMiss} safe misses left\n`;
      });
      text += '\n';
    }

    if (riskyOptions.length > 0) {
      text += `🚨 **DO NOT BUNK (Risk):**\n`;
      riskyOptions.forEach(r => {
        text += `• **${r.name}** — Need to attend! (${r.safeMiss} safe misses but ${r.count} classes today)\n`;
      });
    }

    if (safeOptions.length === 0) {
      text += `\n⚠️ Machan, no classes are safe to bunk today. Attend everything!`;
    }

    const cards: AgentCard[] = ranked.map(r => {
      const isSafe = r.score >= 0;
      return {
        type: 'recommendation' as const,
        title: r.name,
        subtitle: `${r.count} class${r.count > 1 ? 'es' : ''} today`,
        value: isSafe ? `Rank ${safeOptions.indexOf(r) + 1}` : 'Risk',
        status: isSafe ? 'safe' : 'risk',
        icon: isSafe ? '🟢' : '🔴',
        badge: `${r.safeMiss} safe limit`,
      };
    });

    return { text, agentType: 'bunk', cards };
  },
};

import type { NormalizedStudentData } from '@srm/shared';

// ─── Shared Agent Types ───────────────────────────────────────────────────────

export type AgentType = 'attendance' | 'leave' | 'recovery' | 'bunk' | 'academic' | 'general';

export type CardStatus = 'safe' | 'watch' | 'risk' | 'info' | 'unavailable';

export interface AgentCard {
  type: 'subject-row' | 'recommendation' | 'stat' | 'alert' | 'recovery-step';
  title: string;
  subtitle?: string;
  value?: string;
  status?: CardStatus;
  icon?: string;
  badge?: string;
}

export interface AgentResponse {
  text: string;
  agentType: AgentType;
  cards?: AgentCard[];
}

// ─── Intent Classifier ───────────────────────────────────────────────────────

export function classifyIntent(message: string): AgentType {
  const lower = message.toLowerCase();

  // Bunk recommendation — "which class", "today bunk", "safe to skip"
  if (
    /which.*class|safe.*bunk|bunk.*today|today.*bunk|rank.*class|best.*miss|best.*skip|enga.*bunk|entha.*class/.test(lower)
  ) return 'bunk';

  // Recovery — "recover", "improve", "how to get 75"
  if (
    /recover|bring.*up|improve|increase.*attend|how.*get.*75|how.*reach|miss panniten|missed.*a lot|below 75|below target/.test(lower)
  ) return 'recovery';

  // Leave / absence planning — "leave", "bunk tomorrow", "can I miss"
  if (
    /leave|bunk|miss.*tomor|skip|absent|holiday|tomor|today.*all|full.?day/.test(lower)
  ) return 'leave';

  // General attendance status
  if (
    /attendance|percent|status|health|evlo|irukku|safe miss|how many|overall|subject.*attend|my attend/.test(lower)
  ) return 'attendance';

  // Academic / CGPA / SGPA
  if (
    /cgpa|sgpa|grade|gpa|mark|target|predict|what if/.test(lower)
  ) return 'academic';

  return 'general';
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

import { AttendanceAgent } from './AttendanceAgent';
import { LeaveDecisionAgent } from './LeaveDecisionAgent';
import { RecoveryAgent } from './RecoveryAgent';
import { BunkRecommendationAgent } from './BunkRecommendationAgent';
import { AcademicAgent } from './AcademicAgent';

const HELP_TEXT = `Machan! 😄 Naan ungaluku help pannuven. Itha try pannu:

• "Attendance evlo irukku?"
• "Tomorrow leave edukalama?"
• "Today which class safe to bunk?"
• "DLD recover pannanum, how?"
• "Safe misses evlo irukku?"`;

export function processMessage(
  message: string,
  studentData: NormalizedStudentData
): AgentResponse {
  const intent = classifyIntent(message);

  switch (intent) {
    case 'attendance':   return AttendanceAgent.respond(message, studentData);
    case 'leave':        return LeaveDecisionAgent.respond(message, studentData);
    case 'recovery':     return RecoveryAgent.respond(message, studentData);
    case 'bunk':         return BunkRecommendationAgent.respond(message, studentData);
    case 'academic':     return AcademicAgent.respond(message, studentData);
    default:
      return { text: HELP_TEXT, agentType: 'general' };
  }
}

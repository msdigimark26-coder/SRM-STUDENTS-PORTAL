import type { NormalizedStudentData, AcademicSubject } from '@srm/shared';
import type { AgentResponse } from './AgentOrchestrator';
import { calculateCGPA, calculateSGPA, calculateRequiredSGPA } from '../utils/academicUtils';

export class AcademicAgent {
  static respond(message: string, studentData: NormalizedStudentData): AgentResponse {
    const lower = message.toLowerCase();
    
    const pastSemesters = studentData.academic?.pastSemesters || [];
    const currentSubjects = studentData.academic?.currentSubjects || studentData.subjects.map(s => ({ ...s, expectedGrade: 'None' } as AcademicSubject));

    // 1. Ask for Target CGPA ("Enakku 8.5 CGPA venum...")
    if (/target|reach.*cgpa|venum|cgpa.*reach|grades.*need/i.test(lower)) {
      const targetMatch = message.match(/(\d+\.\d+|\d+)/);
      if (targetMatch) {
        const targetCGPA = parseFloat(targetMatch[0]);
        if (targetCGPA > 10 || targetCGPA < 0) {
          return {
            text: `Machan, ${targetCGPA} CGPA laam impossible da. Valid target (e.g. 8.5) kudu.`,
            agentType: 'academic'
          };
        }

        const { cgpa, totalCredits: completedCredits } = calculateCGPA(pastSemesters);
        const { totalCredits: currentSemesterCredits } = calculateSGPA(currentSubjects, true);

        const { requiredSGPA, possible } = calculateRequiredSGPA(cgpa, completedCredits, currentSemesterCredits > 0 ? currentSemesterCredits : 20, targetCGPA);

        if (!possible) {
          return {
            text: `Un current CGPA ${cgpa.toFixed(2)}. \n\n${targetCGPA} CGPA reach panna indha sem la ${requiredSGPA.toFixed(2)} SGPA edukkanum. Idhu mathematically impossible da (Max 10 thaan eduka mudiyum). Next semester target ah korachu veko!`,
            agentType: 'academic',
            cards: [
              { type: 'alert', title: 'Target Not Achievable', subtitle: `Required SGPA: ${requiredSGPA.toFixed(2)}`, status: 'risk' }
            ]
          };
        }

        return {
          text: `Un current CGPA ${cgpa.toFixed(2)}.\n\n${targetCGPA} reach panna indha semester-la exactly ${requiredSGPA.toFixed(2)} SGPA target pannanum. \n\nBest strategy:\n- Get 'O' or 'A+' in 4-credit subjects.\n- Avoid B grades in high-credit subjects.`,
          agentType: 'academic',
          cards: [
            { type: 'stat', title: 'Required SGPA', value: requiredSGPA.toFixed(2), status: 'info' }
          ]
        };
      }
    }

    // 2. What if scenario ("what will happen if I get A in OS")
    if (/if i get|what will happen/i.test(lower)) {
      return {
        text: `Grade predictions ah check panna namma "What-If Simulator" (Academic Tab la irukku) use pannu. Appo thaan exact credits vechu calculate aagum.`,
        agentType: 'academic'
      };
    }

    // 3. Current SGPA / CGPA queries
    const { cgpa } = calculateCGPA(pastSemesters);
    const { sgpa: currentSGPA } = calculateSGPA(currentSubjects, true);

    return {
      text: `Machan, un current CGPA is ${cgpa > 0 ? cgpa.toFixed(2) : 'not set'}.\n\nIndha semester expected SGPA is ${currentSGPA > 0 ? currentSGPA.toFixed(2) : '0.00'} based on your What-If inputs.\n\nAcademic tab la poi target CGPA predict panniko!`,
      agentType: 'academic',
      cards: [
        { type: 'stat', title: 'Current CGPA', value: cgpa > 0 ? cgpa.toFixed(2) : '--', status: 'safe' },
        { type: 'stat', title: 'Projected SGPA', value: currentSGPA > 0 ? currentSGPA.toFixed(2) : '--', status: 'info' }
      ]
    };
  }
}

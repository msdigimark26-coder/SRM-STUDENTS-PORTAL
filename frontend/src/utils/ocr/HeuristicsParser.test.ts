import { expect, test, describe } from 'vitest';
import { HeuristicsParser } from './HeuristicsParser';
import type { Subject } from '@srm/shared';

describe('HeuristicsParser', () => {
  const mockSubjects: Subject[] = [
    { code: '21CSC302J', name: 'DBMS', credits: 4 },
    { code: '21MAB301T', name: 'Discrete Maths', credits: 4 },
    { code: '21CSC303J', name: 'Operating Systems', credits: 4 }
  ];

  const parser = new HeuristicsParser(mockSubjects);

  test('parses a clean OCR output correctly', () => {
    const rawOcr = `
      Monday
      08:00 - 08:50 21CSC302J
      08:50 - 09:40 21MAB301T
    `;
    const result = parser.parse(rawOcr);
    
    expect(result.length).toBe(2);
    expect(result[0].day).toBe('Monday');
    expect(result[0].startTime).toBe('08:00');
    expect(result[0].endTime).toBe('08:50');
    expect(result[0].subjectCode).toBe('21CSC302J');
    expect(result[0].subjectName).toBe('DBMS');
    
    expect(result[1].subjectCode).toBe('21MAB301T');
  });

  test('handles OCR missing subject codes by matching names', () => {
    const rawOcr = `
      Tuesday
      09:50-10:40 Operating Systems
    `;
    const result = parser.parse(rawOcr);
    
    expect(result.length).toBe(1);
    expect(result[0].subjectCode).toBe('21CSC303J');
    expect(result[0].subjectName).toBe('Operating Systems');
  });

  test('ignores completely malformed noise without any times or subjects', () => {
    const rawOcr = `
      SRM INSTITUTE OF SCIENCE AND TECHNOLOGY
      Attendance Details
      xyz abc 123
    `;
    const result = parser.parse(rawOcr);
    expect(result.length).toBe(0);
  });
});

import type { TimetablePeriod } from '@srm/shared';

export interface IOcrEngine {
  extractText(file: File): Promise<string>;
}

export interface IHeuristicsParser {
  parse(rawText: string): TimetablePeriod[];
}

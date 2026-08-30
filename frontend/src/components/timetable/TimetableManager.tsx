import React, { useState } from 'react';
import type { TimetablePeriod, Timetable, NormalizedStudentData } from '@srm/shared';
import { TimetableUploadArea } from './TimetableUploadArea';
import { TimetableReviewModal } from './TimetableReviewModal';
import { TesseractEngine } from '../../utils/ocr/TesseractEngine';
import { HeuristicsParser } from '../../utils/ocr/HeuristicsParser';

interface TimetableManagerProps {
  studentData: NormalizedStudentData;
  onUpdateTimetable: (timetable: Timetable | null) => void;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({ studentData, onUpdateTimetable }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [parsedPeriods, setParsedPeriods] = useState<TimetablePeriod[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const handleFileSelect = async (file: File) => {
    setActiveFile(file);
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      const engine = new TesseractEngine();
      const rawText = await engine.extractText(file);
      
      const parser = new HeuristicsParser(studentData.subjects);
      const periods = parser.parse(rawText);
      
      setParsedPeriods(periods);
      setShowReview(true);
    } catch (error) {
      console.error('Failed to parse timetable:', error);
      alert('Failed to read the timetable. Please try a clearer image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescan = () => {
    if (activeFile) {
      processFile(activeFile);
    }
  };

  const handleConfirm = (periods: TimetablePeriod[]) => {
    onUpdateTimetable({ sessions: periods });
    setShowReview(false);
    setActiveFile(null);
  };

  const handleCancel = () => {
    setShowReview(false);
    setActiveFile(null);
  };

  return (
    <>
      <TimetableUploadArea onFileSelect={handleFileSelect} isLoading={isLoading} />
      
      {showReview && (
        <TimetableReviewModal 
          initialPeriods={parsedPeriods} 
          knownSubjects={studentData.subjects}
          onConfirm={handleConfirm} 
          onCancel={handleCancel}
          onRescan={handleRescan}
        />
      )}
    </>
  );
};

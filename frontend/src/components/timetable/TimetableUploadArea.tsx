import React, { useRef } from 'react';

interface TimetableUploadAreaProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const TimetableUploadArea: React.FC<TimetableUploadAreaProps> = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        alert('Please upload an image file (PNG/JPG).');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="card" 
      style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        border: `2px dashed ${isLoading ? 'var(--text-muted)' : 'var(--border-color)'}`,
        transition: 'all 0.3s ease',
        background: isLoading ? 'var(--bg-card-hover)' : 'var(--bg-card)'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        fontSize: '2rem'
      }}>
        {isLoading ? '⏳' : '📸'}
      </div>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Upload Your Timetable</h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
        Unlock the Calendar, Daily Planner, and Smart Assistant by simply uploading a screenshot of your timetable.
      </p>
      
      {isLoading ? (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--text-color)', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <p style={{ marginTop: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>Reading your timetable…</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detecting days, periods, timings and subjects</p>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button 
            className="btn-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{ 
              padding: '0.875rem 2rem', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              background: 'var(--text-color)', 
              color: 'var(--bg-card)', 
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Upload Timetable Image
          </button>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Accepts PNG, JPG or JPEG. You can also drag & drop here.
          </p>
        </div>
      )}
    </div>
  );
};

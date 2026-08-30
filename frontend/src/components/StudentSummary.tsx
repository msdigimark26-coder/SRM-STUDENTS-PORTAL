import React from 'react';
import type { StudentProfile, Semester } from '@srm/shared';

interface StudentSummaryProps {
  profile: StudentProfile;
  semester: Semester;
}

const ProfileField: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value || value === 'Unknown' || value === '—') return null;
  return (
    <div className="profile-meta-item">
      <span className="profile-meta-label">{label}</span>
      <span className="profile-meta-value">{value}</span>
    </div>
  );
};

export const StudentSummary: React.FC<StudentSummaryProps> = ({ profile, semester }) => {
  const statusColor = profile.status?.toLowerCase() === 'active' ? 'var(--status-safe)' : 'var(--text-muted)';
  const statusBg = profile.status?.toLowerCase() === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(71,85,105,0.12)';
  const statusBorder = profile.status?.toLowerCase() === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(71,85,105,0.2)';

  return (
    <div className="student-summary card">
      <div className="profile-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <h2 className="student-name">{profile.name}</h2>
          {profile.status && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`,
              padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem',
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
              {profile.status}
            </span>
          )}
        </div>
        <div className="profile-meta">
          <ProfileField label="Student ID" value={profile.studentId} />
          <ProfileField label="Register No." value={profile.registerNumber} />
          <ProfileField label="Email ID" value={profile.email} />
          <ProfileField label="Program" value={profile.program !== 'Unknown' ? profile.program : undefined} />
          <ProfileField label="Institution" value={profile.institution} />
          <ProfileField label="Semester" value={semester.name} />
        </div>
      </div>
      <div className="semester-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        {profile.imageUrl && (
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
          />
        )}
        <span className="semester-badge">Sem {profile.semester ?? semester.id}</span>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { X, Lock, User, ShieldCheck } from 'lucide-react';
import type { LoginCredentials, CaptchaResponse } from '@srm/shared';

interface LoginModalProps {
  captchaData: CaptchaResponse;
  onLogin: (credentials: LoginCredentials) => void;
  onClose: () => void;
  error?: string;
  isLoggingIn: boolean;
}

export function LoginModal({ captchaData, onLogin, onClose, error, isLoggingIn }: LoginModalProps) {
  const [netId, setNetId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!netId || !password || !captchaValue || isLoggingIn) return;

    onLogin({
      sessionId: captchaData.sessionId,
      netId,
      password,
      captchaValue
    });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="card-glass" style={{
        background: 'linear-gradient(135deg, rgba(30,30,40,0.9), rgba(20,20,25,0.95))',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
        }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Lock size={28} style={{ color: '#60a5fa' }} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Secure Login</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Authenticate with SRMIST Portal</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.5rem',
            fontSize: '0.85rem', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>NetID</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="text" 
                value={netId}
                onChange={e => setNetId(e.target.value)}
                placeholder="e.g. AB1234"
                required
                disabled={isLoggingIn}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoggingIn}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', background: 'white', padding: '0.5rem', borderRadius: '8px' }}>
              <img src={captchaData.captchaImageBase64} alt="CAPTCHA" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
            
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="text" 
                value={captchaValue}
                onChange={e => setCaptchaValue(e.target.value)}
                placeholder="Enter CAPTCHA text"
                maxLength={8}
                required
                disabled={isLoggingIn}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
                  letterSpacing: '2px', textTransform: 'uppercase'
                }}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoggingIn} style={{
            width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem', fontWeight: 600,
            cursor: isLoggingIn ? 'wait' : 'pointer', boxShadow: '0 8px 25px -5px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s',
            opacity: isLoggingIn ? 0.7 : 1
          }}>
            {isLoggingIn ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>Your credentials are encrypted and sent directly to SRMIST.</span>
          <span>We do not store your password.</span>
        </div>
      </div>
    </div>
  );
}

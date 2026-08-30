import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    const wasDismissed = localStorage.getItem('pwa_install_dismissed');
    if (wasDismissed) return;

    // Check if already running as a standalone PWA
    if (
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone
    ) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay for a better UX experience
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  if (!showBanner || dismissed || installed || !deferredPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        left: '1rem',
        right: '1rem',
        zIndex: 500,
        background: 'rgba(17, 24, 39, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
        animation: 'slideUpBanner 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* App icon */}
      <img
        src="/logo.png"
        alt="Bunk Adkirow"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          flexShrink: 0,
          objectFit: 'contain',
        }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
          Install Bunk Adkirow
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
          Home screen-la add pannu — faster, offline-ready!
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.45rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '36px',
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          }}
        >
          Install ↓
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.3rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            minHeight: '28px',
            textAlign: 'center',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
};

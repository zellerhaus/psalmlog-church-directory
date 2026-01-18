'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null;

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-[var(--border)] shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 pr-8">
          <p className="text-sm text-[var(--foreground)]">
            We use cookies to improve your experience and analyze site traffic. By continuing to use this site, you agree to our use of cookies.{' '}
            <a
              href="/privacy"
              className="text-[var(--primary)] hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            Accept
          </button>
        </div>
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 sm:hidden text-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Close cookie notice"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

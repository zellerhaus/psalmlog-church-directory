'use client';

import { useState, Fragment, useEffect } from 'react';
import { X, Download, Check, Loader2 } from 'lucide-react';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
  };
}

export default function EmailCaptureModal({ isOpen, onClose }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [utmParams, setUtmParams] = useState<UtmParams>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  });
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setUtmParams(getUtmParams());
    setCurrentPath(window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'church_directory',
          page_url: currentPath,
          ...utmParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Check your email!
              </h3>
              <p className="text-[var(--muted)] mb-6">
                We&apos;ve sent your First-Time Visitor Guide to {email}
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-[var(--secondary)] rounded-xl flex items-center justify-center">
                  <Download className="w-7 h-7 text-[var(--primary)]" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[var(--foreground)] text-center mb-2">
                Free First-Time Visitor Guide
              </h3>
              <p className="text-[var(--muted)] text-center mb-6">
                Get tips on what to wear, what to expect, and how to make the most of your first visit to any church.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Hidden fields for UTM tracking */}
                <input type="hidden" name="utm_source" value={utmParams.utm_source} />
                <input type="hidden" name="utm_medium" value={utmParams.utm_medium} />
                <input type="hidden" name="utm_campaign" value={utmParams.utm_campaign} />
                <input type="hidden" name="utm_term" value={utmParams.utm_term} />
                <input type="hidden" name="utm_content" value={utmParams.utm_content} />
                <input type="hidden" name="page_url" value={currentPath} />

                <div className="mb-4">
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                    disabled={status === 'loading'}
                  />
                  {status === 'error' && (
                    <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary w-full justify-center"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Get Free Guide
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-[var(--muted)] text-center mt-4">
                We&apos;ll also send you occasional tips for your faith journey. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
}

'use client';

import { useState, Fragment, useEffect, useRef } from 'react';
import { X, Check, Loader2, Building2 } from 'lucide-react';
import Turnstile, { TurnstileRef } from './Turnstile';
import { CHURCH_ROLES, ChurchRole } from '@/types/database';

interface ClaimChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  churchName: string;
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

export default function ClaimChurchModal({
  isOpen,
  onClose,
  churchId,
  churchName,
}: ClaimChurchModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<ChurchRole | ''>('');
  const [roleDescription, setRoleDescription] = useState('');
  const [verificationInfo, setVerificationInfo] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
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

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      setStatus('error');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number');
      setStatus('error');
      return;
    }

    if (!role) {
      setErrorMessage('Please select your role at the church');
      setStatus('error');
      return;
    }

    if (role === 'Other' && !roleDescription.trim()) {
      setErrorMessage('Please describe your role');
      setStatus('error');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the verification');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/claim-church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId,
          churchName,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          roleDescription: role === 'Other' ? roleDescription.trim() : null,
          verificationInfo: verificationInfo.trim() || null,
          message: message.trim() || null,
          pageUrl: currentPath,
          turnstileToken,
          ...utmParams,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit claim');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
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
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
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
                Claim Request Submitted
              </h3>
              <p className="text-[var(--muted)] mb-6">
                We&apos;ll review your request and contact you at {email} within 2-3 business days.
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
                  <Building2 className="w-7 h-7 text-[var(--primary)]" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[var(--foreground)] text-center mb-2">
                Claim {churchName}
              </h3>
              <p className="text-[var(--muted)] text-center mb-6">
                Help us keep this listing accurate. We&apos;ll verify your affiliation before approving.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="claimEmail" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="claimEmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Your Role at the Church *
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as ChurchRole | '')}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none bg-white"
                      disabled={status === 'loading'}
                    >
                      <option value="">Select your role</option>
                      {CHURCH_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Role Description (conditional) */}
                  {role === 'Other' && (
                    <div>
                      <label htmlFor="roleDescription" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Describe Your Role *
                      </label>
                      <input
                        type="text"
                        id="roleDescription"
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        placeholder="e.g., Worship Leader, Deacon, etc."
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                        disabled={status === 'loading'}
                      />
                    </div>
                  )}

                  {/* Verification Info */}
                  <div>
                    <label htmlFor="verificationInfo" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      How can we verify your affiliation?
                    </label>
                    <textarea
                      id="verificationInfo"
                      value={verificationInfo}
                      onChange={(e) => setVerificationInfo(e.target.value)}
                      placeholder="e.g., I'm listed on the church website, I have a church email address, etc."
                      rows={2}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none resize-none"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Corrections or updates to the listing?
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Let us know if any information needs to be updated"
                      rows={2}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none resize-none"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Turnstile */}
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      onVerify={setTurnstileToken}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setTurnstileToken(null)}
                    />
                  </div>

                  {/* Error message */}
                  {status === 'error' && (
                    <p className="text-sm text-red-600 text-center">{errorMessage}</p>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-primary w-full justify-center"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Claim Request'
                    )}
                  </button>
                </div>
              </form>

              <p className="text-xs text-[var(--muted)] text-center mt-4">
                We&apos;ll review your request and may contact you for verification.
              </p>
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
}

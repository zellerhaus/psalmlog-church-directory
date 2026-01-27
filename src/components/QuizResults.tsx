'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  MapPin,
  Mail,
  Share2,
  ChevronRight,
  Loader2,
  Sparkles,
  Copy,
  Twitter,
  Facebook,
} from 'lucide-react';
import Turnstile, { TurnstileRef } from './Turnstile';
import { type QuizResult, buildSearchUrl } from '@/lib/quiz';

interface QuizResultsProps {
  result: QuizResult;
}

export default function QuizResults({ result }: QuizResultsProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.href);
  }, []);

  const { primary, secondary } = result;

  const handleFindChurches = () => {
    if (!location.trim()) {
      // Focus the location input
      document.getElementById('location-input')?.focus();
      return;
    }
    const url = buildSearchUrl(result.searchFilters, location);
    router.push(url);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setEmailStatus('error');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the verification');
      setEmailStatus('error');
      return;
    }

    setEmailStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'church_quiz',
          quiz_result: primary.id,
          page_url: currentPath,
          turnstileToken,
          utm_source: 'quiz',
          utm_medium: 'organic',
          utm_campaign: 'church_finder_quiz',
          utm_content: primary.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setEmailStatus('success');
    } catch (err) {
      setEmailStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  const handleShare = async (platform?: 'twitter' | 'facebook' | 'copy') => {
    const shareText = `I just found out I'd thrive in a ${primary.name} church! Take the quiz to find your match:`;
    const shareUrl = `${window.location.origin}/churches/quiz`;

    if (platform === 'copy') {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    } else if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Result Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--secondary)] rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-[var(--primary)]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2">
          Your Church Match
        </h1>
        <p className="text-lg text-[var(--muted)]">
          Based on your answers, here&apos;s where you might thrive
        </p>
      </div>

      {/* Primary Result Card */}
      <div className="card p-6 md:p-8 mb-6 border-2 border-[var(--primary)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-[var(--secondary)] text-[var(--primary)] text-sm font-medium rounded-full mb-2">
              Best Match
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              {primary.name}
            </h2>
          </div>
        </div>

        <p className="text-[var(--muted)] mb-6 text-lg">
          {primary.description}
        </p>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-[var(--foreground)]">
            What to expect:
          </h3>
          {primary.characteristics.map((char, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-[var(--muted)]">{char}</span>
            </div>
          ))}
        </div>

        {/* Matching denominations */}
        <div className="flex flex-wrap gap-2">
          {primary.denominations.slice(0, 4).map((denom) => (
            <span key={denom} className="badge badge-primary">
              {denom}
            </span>
          ))}
          {primary.worshipStyles.slice(0, 2).map((style) => (
            <span key={style} className="badge badge-secondary">
              {style}
            </span>
          ))}
        </div>
      </div>

      {/* Secondary Result */}
      {secondary && (
        <div className="card p-5 mb-8 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[var(--muted)]">Also consider:</span>
              <h3 className="font-semibold text-[var(--foreground)]">
                {secondary.name}
              </h3>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
          </div>
        </div>
      )}

      {/* Find Churches Section */}
      <div className="card p-6 mb-6">
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Find matching churches near you
        </h3>
        <p className="text-[var(--muted)] mb-4">
          Enter your city or zip code to see {primary.name} churches in your area.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
            <input
              id="location-input"
              type="text"
              placeholder="Enter city or zip code..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindChurches()}
              className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
            />
          </div>
          <button
            onClick={handleFindChurches}
            className="btn-primary whitespace-nowrap"
          >
            Find Churches
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>

      {/* Email Capture */}
      <div className="card p-6 mb-6 bg-[var(--secondary)]">
        {emailStatus === 'success' ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-[var(--foreground)] mb-1">
              Check your email!
            </h3>
            <p className="text-[var(--muted)] text-sm">
              We&apos;ve sent your personalized guide to {email}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--foreground)]">
                  Get your personalized guide
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  First-time visitor tips tailored for {primary.name} churches
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailStatus === 'loading'}
                  className="flex-1 px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none bg-white"
                />
                <button
                  type="submit"
                  disabled={emailStatus === 'loading'}
                  className="btn-primary whitespace-nowrap"
                >
                  {emailStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Guide'
                  )}
                </button>
              </div>

              <div className="flex justify-center mb-3">
                <Turnstile
                  ref={turnstileRef}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

              {emailStatus === 'error' && (
                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
              )}
            </form>

            <p className="text-xs text-[var(--muted)] text-center">
              We&apos;ll also send occasional tips for your faith journey. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>

      {/* Share */}
      <div className="text-center">
        <button
          onClick={() => setShowShare(!showShare)}
          className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share your results
        </button>

        {showShare && (
          <div className="flex justify-center gap-3 mt-3">
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

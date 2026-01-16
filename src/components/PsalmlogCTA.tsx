import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { PSALMLOG_LANDING_URL } from '@/lib/constants';

interface PsalmlogCTAProps {
  variant?: 'sidebar' | 'inline' | 'bottom';
  campaign?: string;
}

export default function PsalmlogCTA({ variant = 'sidebar' }: PsalmlogCTAProps) {
  const landingUrl = PSALMLOG_LANDING_URL;

  if (variant === 'inline') {
    return (
      <div className="bg-[var(--secondary)] rounded-lg p-6 my-6 border border-[var(--border)]">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[var(--primary-foreground)]" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">
              Wherever you worship, take biblical guidance with you
            </h3>
            <p className="text-[var(--muted)] text-sm mb-3">
              Get daily scripture-based guidance for life&apos;s big questions with the free Psalmlog app.
            </p>
            <Link
              href={landingUrl}
              className="btn-primary text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try Psalmlog
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'bottom') {
    return (
      <div className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2 font-serif">
            Found your church?
          </h3>
          <p className="text-gray-300 mb-6">
            Get daily biblical guidance for your faith journey with the free Psalmlog app.
            Join thousands of believers growing deeper in their faith.
          </p>
          <Link
            href={landingUrl}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-[var(--primary)] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try Psalmlog
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  // Default: sidebar variant
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-6 lg:sticky lg:top-24">
      <div className="text-center">
        <div className="w-14 h-14 bg-[var(--secondary)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-[var(--primary)]" />
        </div>
        <h3 className="font-semibold text-[var(--foreground)] mb-2 font-serif">
          Found your church?
        </h3>
        <p className="text-[var(--muted)] text-sm mb-4">
          Get daily biblical guidance with the free Psalmlog app.
        </p>
        <Link
          href={landingUrl}
          className="btn-primary w-full text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try Psalmlog
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import EmailCaptureModal from './EmailCaptureModal';

interface FirstVisitGuideCTAProps {
  variant?: 'default' | 'sidebar';
}

export default function FirstVisitGuideCTA({ variant = 'default' }: FirstVisitGuideCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === 'sidebar') {
    return (
      <>
        <div className="bg-white border border-[var(--border)] rounded-lg p-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-[var(--secondary)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Download className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2 font-serif">
              Visiting a church?
            </h3>
            <p className="text-[var(--muted)] text-sm mb-4">
              Get our free first-time visitor guide.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full text-sm"
            >
              Download Guide
              <Download className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        <EmailCaptureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-[var(--secondary)] rounded-xl p-8 md:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl flex items-center justify-center">
                <Download className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 font-serif">
                Free First-Time Visitor Guide
              </h3>
              <p className="text-[var(--muted)] mb-4 md:mb-0">
                Not sure what to expect? Download our free guide with tips on what to wear,
                when to arrive, and how to make the most of your first visit to any church.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                Get Free Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmailCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import EmailCaptureModal from '@/components/EmailCaptureModal';

interface ChurchClientSectionProps {
  whatToExpect: string | null;
}

export default function ChurchClientSection({ whatToExpect }: ChurchClientSectionProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  if (!whatToExpect) {
    return null;
  }

  return (
    <>
      <div className="card p-6 bg-[var(--secondary)] border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)] font-serif">
          What to Expect as a First-Time Visitor
        </h2>
        <div className="prose max-w-none">
          {whatToExpect.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-[var(--muted)] mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        <button
          onClick={() => setEmailModalOpen(true)}
          className="mt-6 btn-primary"
        >
          <Download className="w-4 h-4 mr-2" />
          Get Free First-Time Visitor Guide
        </button>
      </div>

      <EmailCaptureModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </>
  );
}

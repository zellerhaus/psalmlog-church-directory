'use client';

import { useState } from 'react';
import { Navigation, Globe, Phone, ChevronRight, Building2 } from 'lucide-react';
import ClaimChurchModal from './ClaimChurchModal';
import { addChurchUtmParams } from '@/lib/constants';

interface ChurchQuickActionsProps {
  churchId: string;
  churchName: string;
  googleMapsUrl: string;
  website: string | null;
  phone: string | null;
}

export default function ChurchQuickActions({
  churchId,
  churchName,
  googleMapsUrl,
  website,
  phone,
}: ChurchQuickActionsProps) {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  return (
    <>
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg hover:bg-[var(--border)] transition-colors"
          >
            <Navigation className="w-5 h-5 text-[var(--muted)]" />
            <span className="font-medium">Get Directions</span>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />
          </a>
          {website && (
            <a
              href={addChurchUtmParams(website, 'sidebar')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg hover:bg-[var(--border)] transition-colors"
            >
              <Globe className="w-5 h-5 text-[var(--muted)]" />
              <span className="font-medium">Visit Website</span>
              <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg hover:bg-[var(--border)] transition-colors"
            >
              <Phone className="w-5 h-5 text-[var(--muted)]" />
              <span className="font-medium">Call Church</span>
              <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />
            </a>
          )}

          {/* Claim Church Button */}
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg hover:bg-[var(--border)] transition-colors w-full text-left"
          >
            <Building2 className="w-5 h-5 text-[var(--muted)]" />
            <span className="font-medium">Claim This Church</span>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] ml-auto" />
          </button>
        </div>
      </div>

      <ClaimChurchModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        churchId={churchId}
        churchName={churchName}
      />
    </>
  );
}

'use client';

import Link from 'next/link';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import type { Church } from '@/types/database';
import FavoriteButton from '@/components/FavoriteButton';
import type { FavoriteChurch } from '@/lib/favorites';

interface ChurchCardProps {
  church: Church;
  stateSlug: string;
  citySlug: string;
}

export default function ChurchCard({ church, stateSlug, citySlug }: ChurchCardProps) {
  const churchUrl = `/churches/${stateSlug}/${citySlug}/${church.slug}`;

  // Format service times for display
  const primaryServiceTime = church.service_times?.[0];
  const serviceDisplay = primaryServiceTime
    ? `${primaryServiceTime.day} ${primaryServiceTime.time}`
    : null;

  // Get worship style badges
  const worshipStyles = church.worship_style?.slice(0, 2) || [];

  // Prepare church data for FavoriteButton
  const favoriteChurch: FavoriteChurch = {
    id: church.id,
    slug: church.slug,
    name: church.name,
    city: church.city,
    stateAbbr: church.state_abbr,
    stateSlug,
    citySlug,
  };

  return (
    <Link href={churchUrl} className="card block p-5 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-1">
            {church.name}
          </h3>
          {church.denomination && (
            <span className="text-sm text-[var(--muted)]">{church.denomination}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <FavoriteButton church={favoriteChurch} />
          <ChevronRight className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm text-[var(--muted)]">
          <MapPin className="w-4 h-4 text-[var(--muted)] flex-shrink-0 mt-0.5" />
          <span>{church.address}, {church.city}, {church.state_abbr} {church.zip}</span>
        </div>

        {serviceDisplay && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Clock className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
            <span>{serviceDisplay}</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {worshipStyles.map((style) => (
          <span key={style} className="badge badge-primary">
            {style}
          </span>
        ))}

        {church.has_kids_ministry && (
          <span className="badge badge-secondary">
            <Users className="w-3 h-3 mr-1" />
            Kids Ministry
          </span>
        )}
      </div>
    </Link>
  );
}

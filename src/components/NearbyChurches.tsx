import Link from 'next/link';
import { MapPin, ChevronRight, Navigation } from 'lucide-react';
import type { Church } from '@/types/database';
import { US_STATES } from '@/lib/constants';

interface NearbyChurchesProps {
  churches: Church[];
  currentChurchId: string;
  currentCity: string;
}

export default function NearbyChurches({ churches, currentChurchId, currentCity }: NearbyChurchesProps) {
  // Filter out the current church and limit to 4
  const filteredChurches = churches
    .filter((church) => church.id !== currentChurchId)
    .slice(0, 4);

  if (filteredChurches.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-[var(--primary)]" />
        Churches Near You
      </h3>
      <div className="space-y-3">
        {filteredChurches.map((church) => {
          const stateInfo = US_STATES.find(s => s.abbr === church.state_abbr);
          const stateSlug = stateInfo?.slug || church.state_abbr.toLowerCase();
          const citySlug = church.city.toLowerCase().replace(/\s+/g, '-');
          const isInCurrentCity = church.city.toLowerCase() === currentCity.toLowerCase();

          return (
            <Link
              key={church.id}
              href={`/churches/${stateSlug}/${citySlug}/${church.slug}`}
              className="flex items-start gap-3 p-3 bg-[var(--secondary)] rounded-lg hover:bg-[var(--border)] transition-colors group"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[var(--background)] rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[var(--primary)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)]">
                  {church.name}
                </h4>
                <p className="text-sm text-[var(--muted)]">
                  {isInCurrentCity ? (church.denomination || 'Church') : `${church.city}, ${church.state_abbr}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0 mt-3" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

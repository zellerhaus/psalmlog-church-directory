'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import ChurchCard from '@/components/ChurchCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getFavorites, clearFavorites, type FavoriteChurch } from '@/lib/favorites';
import type { Church } from '@/types/database';

// Convert FavoriteChurch to Church type for ChurchCard compatibility
function favoriteToChurch(favorite: FavoriteChurch): Church {
  return {
    id: favorite.id,
    slug: favorite.slug,
    name: favorite.name,
    city: favorite.city,
    state: '',
    state_abbr: favorite.stateAbbr,
    address: '',
    zip: '',
    lat: 0,
    lng: 0,
    denomination: favorite.denomination ?? null,
    website: null,
    phone: null,
    email: null,
    worship_style: favorite.worshipStyle ?? null,
    service_times: null,
    has_kids_ministry: favorite.hasKidsMinistry ?? false,
    has_youth_group: favorite.hasYouthGroup ?? false,
    has_small_groups: favorite.hasSmallGroups ?? false,
    ai_description: null,
    ai_what_to_expect: null,
    ai_generated_at: null,
    source: null,
    source_id: null,
    created_at: '',
    updated_at: '',
  };
}

export default function SavedChurchesPage() {
  const [favorites, setFavorites] = useState<FavoriteChurch[]>([]);

  // Load favorites on mount
  useEffect(() => {
    // Initial load from localStorage
    const loadFavorites = () => setFavorites(getFavorites());
    loadFavorites();

    // Poll for changes since storage event only fires cross-tab
    const interval = setInterval(loadFavorites, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    clearFavorites();
    setFavorites([]);
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Saved Churches' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2 font-serif">
            Saved Churches
          </h1>
          <p className="text-[var(--muted)]">
            {favorites.length === 0
              ? 'Churches you save will appear here'
              : `${favorites.length} saved church${favorites.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors self-start"
            aria-label="Clear all saved churches"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-[var(--secondary)] rounded-lg">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Heart className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 font-serif">
            No saved churches yet
          </h2>
          <p className="text-[var(--muted)] max-w-md mx-auto mb-6">
            Click the heart icon on any church to save it here for easy access later.
          </p>
          <Link href="/churches" className="btn-primary">
            Browse Churches
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <ChurchCard
              key={favorite.id}
              church={favoriteToChurch(favorite)}
              stateSlug={favorite.stateSlug}
              citySlug={favorite.citySlug}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA when there are favorites */}
      {favorites.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-[var(--muted)] mb-4">Looking for more churches?</p>
          <Link href="/churches" className="btn-primary">
            Browse All Churches
          </Link>
        </div>
      )}
    </div>
  );
}

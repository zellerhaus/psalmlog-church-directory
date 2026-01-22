'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { Heart } from 'lucide-react';
import {
  isFavorite,
  toggleFavorite,
  type FavoriteChurch,
} from '@/lib/favorites';

interface FavoriteButtonProps {
  church: FavoriteChurch;
  className?: string;
}

// Subscribe to storage events for cross-tab sync
function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

// Server snapshot always returns false (not favorited)
function getServerSnapshot(): boolean {
  return false;
}

export default function FavoriteButton({
  church,
  className = '',
}: FavoriteButtonProps) {
  // Use key to force re-render when toggling
  const [updateKey, setUpdateKey] = useState(0);

  // Get current favorite status from localStorage
  const getSnapshot = useCallback((): boolean => {
    return isFavorite(church.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [church.id, updateKey]);

  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleFavorite(church);
    // Force re-render to pick up new state
    setUpdateKey((k) => k + 1);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-full hover:bg-[var(--card-hover)] transition-colors ${className}`}
      aria-label={saved ? 'Remove from saved' : 'Save church'}
    >
      {saved ? (
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
      ) : (
        <Heart className="w-5 h-5 text-[var(--muted)] hover:text-red-500 transition-colors" />
      )}
    </button>
  );
}

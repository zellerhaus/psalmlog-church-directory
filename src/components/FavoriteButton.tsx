'use client';

import { useState, useEffect } from 'react';
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

export default function FavoriteButton({
  church,
  className = '',
}: FavoriteButtonProps) {
  const [saved, setSaved] = useState(false);

  // Check favorite status on mount
  useEffect(() => {
    const checkStatus = () => setSaved(isFavorite(church.id));
    checkStatus();
  }, [church.id]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newState = toggleFavorite(church);
    setSaved(newState);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative z-10 p-2 rounded-full hover:bg-[var(--card-hover)] transition-colors ${className}`}
      aria-label={saved ? 'Remove from saved' : 'Save church'}
    >
      <Heart
        className="w-5 h-5 transition-colors"
        style={{
          color: saved ? '#ef4444' : 'var(--muted)',
          fill: saved ? '#ef4444' : 'none',
        }}
      />
    </button>
  );
}

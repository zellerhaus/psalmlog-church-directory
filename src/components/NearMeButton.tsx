'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2 } from 'lucide-react';

interface NearMeButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function NearMeButton({ className = '', variant = 'primary' }: NearMeButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNearMe = async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Call API to get nearest city
        try {
          const response = await fetch(`/api/nearest-city?lat=${latitude}&lng=${longitude}`);
          const data = await response.json();

          if (data.city && data.state) {
            // Redirect to the city page
            router.push(`/churches/${data.stateSlug}/${data.citySlug}`);
          } else {
            // Fallback to search with coordinates
            router.push(`/churches/search?lat=${latitude}&lng=${longitude}`);
          }
        } catch {
          setError('Unable to find nearby churches. Please try searching.');
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('Unable to get your location.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
    secondary: 'bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)]',
    outline: 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]',
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleNearMe}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        {isLoading ? 'Finding churches...' : 'Churches Near Me'}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}

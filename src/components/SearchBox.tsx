'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
  size?: 'default' | 'large';
}

export default function SearchBox({
  placeholder = 'Search by city or zip code...',
  className = '',
  size = 'default'
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/churches/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const sizeClasses = size === 'large'
    ? 'py-4 px-5 text-lg'
    : 'py-3 px-4';

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] ${size === 'large' ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${sizeClasses} pl-12 pr-24 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)] focus:border-white outline-none`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 btn-primary cursor-pointer ${size === 'large' ? 'py-2.5 px-5' : 'py-2 px-4'}`}
        >
          <Search className={`${size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
          Search
        </button>
      </div>
    </form>
  );
}

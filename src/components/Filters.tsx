'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DENOMINATIONS, WORSHIP_STYLES } from '@/lib/constants';
import { Filter, X } from 'lucide-react';

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDenomination = searchParams.get('denomination') || '';
  const currentWorshipStyle = searchParams.get('worship_style') || '';
  const hasKidsMinistry = searchParams.get('kids') === 'true';
  const hasYouthGroup = searchParams.get('youth') === 'true';
  const hasSmallGroups = searchParams.get('groups') === 'true';

  const hasActiveFilters = currentDenomination || currentWorshipStyle || hasKidsMinistry || hasYouthGroup || hasSmallGroups;

  const updateFilter = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === '' || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--muted)]" />
          <span className="font-medium text-[var(--foreground)]">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Denomination filter */}
        <div>
          <label htmlFor="denomination" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Denomination
          </label>
          <select
            id="denomination"
            value={currentDenomination}
            onChange={(e) => updateFilter('denomination', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="">All Denominations</option>
            {DENOMINATIONS.map((denom) => (
              <option key={denom} value={denom}>
                {denom}
              </option>
            ))}
          </select>
        </div>

        {/* Worship style filter */}
        <div>
          <label htmlFor="worship_style" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Worship Style
          </label>
          <select
            id="worship_style"
            value={currentWorshipStyle}
            onChange={(e) => updateFilter('worship_style', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="">All Styles</option>
            {WORSHIP_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        {/* Programs checkboxes */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Programs
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasKidsMinistry}
                onChange={(e) => updateFilter('kids', e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded border-[var(--border)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Kids Ministry</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasYouthGroup}
                onChange={(e) => updateFilter('youth', e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded border-[var(--border)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Youth Group</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSmallGroups}
                onChange={(e) => updateFilter('groups', e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded border-[var(--border)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Small Groups</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

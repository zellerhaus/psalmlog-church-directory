'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ComparisonSelectorProps {
  denominations: { slug: string; name: string }[];
  selectedLeft?: string;
  selectedRight?: string;
}

export default function ComparisonSelector({
  denominations,
  selectedLeft,
  selectedRight,
}: ComparisonSelectorProps) {
  const router = useRouter();
  const [left, setLeft] = useState(selectedLeft || '');
  const [right, setRight] = useState(selectedRight || '');

  const handleCompare = () => {
    if (left && right && left !== right) {
      router.push(`/churches/denominations/compare?d1=${left}&d2=${right}`);
    }
  };

  const handleSwap = () => {
    const temp = left;
    setLeft(right);
    setRight(temp);
    if (left && right && left !== right) {
      router.push(`/churches/denominations/compare?d1=${right}&d2=${left}`);
    }
  };

  const handleLeftChange = (value: string) => {
    setLeft(value);
    if (value && right && value !== right) {
      router.push(`/churches/denominations/compare?d1=${value}&d2=${right}`);
    }
  };

  const handleRightChange = (value: string) => {
    setRight(value);
    if (left && value && left !== value) {
      router.push(`/churches/denominations/compare?d1=${left}&d2=${value}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
      <select
        value={left}
        onChange={(e) => handleLeftChange(e.target.value)}
        className="w-full sm:w-auto flex-1 px-4 py-3 border border-[var(--border)] rounded-lg bg-white text-[var(--foreground)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
        aria-label="Select first denomination"
      >
        <option value="">Select denomination...</option>
        {denominations
          .filter((d) => d.slug !== right)
          .map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
      </select>

      <button
        onClick={handleSwap}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors"
        aria-label="Swap denominations"
        title="Swap denominations"
      >
        <ArrowLeftRight className="w-4 h-4 text-[var(--muted)]" />
      </button>

      <select
        value={right}
        onChange={(e) => handleRightChange(e.target.value)}
        className="w-full sm:w-auto flex-1 px-4 py-3 border border-[var(--border)] rounded-lg bg-white text-[var(--foreground)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
        aria-label="Select second denomination"
      >
        <option value="">Select denomination...</option>
        {denominations
          .filter((d) => d.slug !== left)
          .map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
      </select>

      {!selectedLeft || !selectedRight ? (
        <button
          onClick={handleCompare}
          disabled={!left || !right || left === right}
          className="w-full sm:w-auto btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Compare
        </button>
      ) : null}
    </div>
  );
}

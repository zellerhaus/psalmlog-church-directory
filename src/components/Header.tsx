'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { PSALMLOG_URLS } from '@/lib/constants';

interface HeaderProps {
  popularStates?: { name: string; slug: string }[];
}

export default function Header({ popularStates = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/churches/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
      <nav className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/churches" className="flex items-center gap-2">
            <Image
              src="/psalmlog-icon.jpg"
              alt="Psalmlog"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg"
              priority
            />
            <span className="font-semibold text-lg text-[var(--foreground)]">Psalmlog Church Finder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/churches"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Browse Churches
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium">
                By State
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white border border-[var(--border)] rounded-lg shadow-lg py-2 min-w-[180px]">
                  {popularStates.length > 0 ? (
                    <>
                      {popularStates.map((state) => (
                        <Link
                          key={state.slug}
                          href={`/churches/${state.slug}`}
                          className="block px-4 py-2 text-gray-600 hover:bg-[var(--secondary)] hover:text-gray-900"
                        >
                          {state.name}
                        </Link>
                      ))}
                      <div className="border-t border-[var(--border)] my-2" />
                    </>
                  ) : null}
                  <Link
                    href="/churches#states"
                    className="block px-4 py-2 text-[var(--primary)] hover:bg-[var(--secondary)] font-medium"
                  >
                    View All States
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="https://psalmlog.com/blog"
              className="text-gray-600 hover:text-gray-900 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </Link>
          </div>

          {/* Search and CTA */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative flex items-center">
              {/* Search form - hidden by default, shown when searchOpen */}
              <form
                onSubmit={handleSearch}
                className={`flex items-center ${searchOpen ? '' : 'hidden'}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City or zip code..."
                  className="w-64 py-2 px-3 pr-8 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2 text-gray-400 hover:text-gray-600"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
              {/* Search button - shown by default, hidden when searchOpen */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`flex items-center gap-2 text-gray-500 hover:text-gray-700 ${searchOpen ? 'hidden' : ''}`}
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
                <span className="text-sm">Search</span>
              </button>
            </div>
            <Link
              href={PSALMLOG_URLS.landing}
              className="btn-primary text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try Psalmlog
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <X className={`w-6 h-6 ${mobileMenuOpen ? '' : 'hidden'}`} />
            <Menu className={`w-6 h-6 ${mobileMenuOpen ? 'hidden' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <Link
                href="/churches"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Churches
              </Link>
              <Link
                href="/churches#states"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse by State
              </Link>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City or zip code..."
                  className="flex-1 py-2 px-3 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                />
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 text-sm"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              <Link
                href={PSALMLOG_URLS.landing}
                className="btn-primary text-sm w-fit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Psalmlog
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { PSALMLOG_URLS } from '@/lib/constants';

interface HeaderProps {
  popularStates?: { name: string; slug: string }[];
}

export default function Header({ popularStates = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          </div>

          {/* Search and CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/churches#search"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <Search className="w-5 h-5" />
              <span className="text-sm">Search</span>
            </Link>
            <Link
              href={PSALMLOG_URLS.header}
              className="btn-primary text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Psalmlog App
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
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
              <Link
                href="/churches#search"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href={PSALMLOG_URLS.mobileMenu}
                className="btn-primary text-sm w-fit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Psalmlog App
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

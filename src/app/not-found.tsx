import Link from 'next/link';
import { Home, Search, MapPin, Church } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16">
        <div className="container-page">
          <div className="max-w-2xl mx-auto text-center">
            {/* 404 Icon */}
            <div className="w-20 h-20 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Church className="w-10 h-10 text-[var(--primary)]" />
            </div>

            {/* Error Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4 font-serif">
              Page Not Found
            </h1>
            <p className="text-lg text-[var(--muted)] mb-8 max-w-md mx-auto">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or no longer exists.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/churches"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                href="/churches/search"
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Churches
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="border-t border-[var(--border)] pt-8">
              <p className="text-sm text-[var(--muted)] mb-4">Or try one of these:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/churches#states"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--secondary)] rounded-lg text-sm text-[var(--foreground)] hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Browse by State
                </Link>
                <Link
                  href="/churches/denominations"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--secondary)] rounded-lg text-sm text-[var(--foreground)] hover:bg-gray-200 transition-colors"
                >
                  <Church className="w-4 h-4" />
                  Browse by Denomination
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

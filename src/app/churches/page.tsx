import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Church, Users, Search as SearchIcon } from 'lucide-react';
import SearchBox from '@/components/SearchBox';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import { getTotalChurchCount, getFeaturedCitiesWithRealCounts } from '@/lib/data';
import { SITE_NAME, SITE_DESCRIPTION, US_STATES } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Find a Church Near You | ${SITE_NAME}`,
  description: `Search churches across America. Filter by denomination, worship style, and programs. Visitor guides for every church.`,
  openGraph: {
    title: `Find a Church Near You | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    type: 'website',
  },
};

export default async function ChurchesHomePage() {
  // Fetch dynamic data from database
  let totalChurches = 0;
  let featuredCities: { name: string; state_abbr: string; slug: string; state: string; church_count: number }[] = [];

  try {
    totalChurches = await getTotalChurchCount();
    featuredCities = await getFeaturedCitiesWithRealCounts(18);
  } catch {
    // Use defaults if database not connected
  }

  // Always use the complete US_STATES list for "Browse by State" section
  // This ensures all 51 states are shown regardless of database state
  const states = US_STATES;

  return (
    <div>
      {/* Hero Section - Dark navy Psalmlog style */}
      <section className="bg-[var(--primary)] text-[var(--primary-foreground)]">
        <div className="container-page py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight font-serif">
              Find Your Church Home
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Discover the right faith community for your life stage, worship style, and spiritual needs—with visitor-friendly information most directories don&apos;t provide.
            </p>

            <div id="search" className="max-w-2xl mx-auto">
              <SearchBox
                placeholder="Search by city or zip code..."
                size="large"
              />
            </div>

            {totalChurches > 0 && (
              <p className="mt-6 text-gray-400">
                <span className="font-semibold text-white">{totalChurches.toLocaleString()}</span> churches across America
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[var(--secondary)]">
        <div className="container-page">
          <p className="section-label text-center mb-8">Why Use Psalmlog Church Finder</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <SearchIcon className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-serif">Easy Search</h3>
              <p className="text-[var(--muted)]">
                Find churches by city, zip code, denomination, or worship style.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Users className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-serif">Visitor Guides</h3>
              <p className="text-[var(--muted)]">
                Know what to expect before your first visit—dress code, service format, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Church className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-serif">All Denominations</h3>
              <p className="text-[var(--muted)]">
                From Baptist to Catholic, traditional to contemporary—find your fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cities */}
      {featuredCities.length > 0 && (
        <section className="py-16">
          <div className="container-page">
            <p className="section-label text-center mb-3">Start Your Search</p>
            <h2 className="text-2xl font-bold text-center mb-8 font-serif">
              Popular Cities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredCities.map((city) => (
                <Link
                  key={`${city.slug}-${city.state_abbr}`}
                  href={`/churches/${city.state.toLowerCase().replace(/\s+/g, '-')}/${city.slug}`}
                  className="card p-4 text-center hover:border-[var(--primary)] hover:border-opacity-30"
                >
                  <div className="flex items-center justify-center gap-1 text-[var(--muted)] mb-1">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-[var(--foreground)]">{city.name}</h3>
                  <p className="text-sm text-[var(--muted)]">{city.state_abbr}</p>
                  <p className="text-xs text-[var(--primary)] font-medium mt-1">
                    {city.church_count} churches
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by State */}
      <section id="states" className="py-16 bg-[var(--secondary)]">
        <div className="container-page">
          <p className="section-label text-center mb-3">Nationwide Coverage</p>
          <h2 className="text-2xl font-bold text-center mb-8 font-serif">
            Browse by State
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {states.map((state) => (
              <Link
                key={state.abbr}
                href={`/churches/${state.slug}`}
                className="px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-center hover:border-[var(--primary)] hover:shadow-sm transition-all"
              >
                <span className="font-medium text-[var(--foreground)]">{state.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Psalmlog CTA */}
      <section className="py-16">
        <div className="container-page">
          <PsalmlogCTA variant="bottom" campaign="national_landing" />
        </div>
      </section>
    </div>
  );
}

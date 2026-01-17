import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Church, Users, Search as SearchIcon, Heart, Music, Baby, BookOpen, BarChart3 } from 'lucide-react';
import SearchBox from '@/components/SearchBox';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import HomeFAQSection from '@/components/HomeFAQSection';
import { getTotalChurchCount, getFeaturedCitiesWithRealCounts, getDenominationStats } from '@/lib/data';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, US_STATES } from '@/lib/constants';

// Revalidate the page every hour (ISR)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Find a Church Near You`,
  description: `Search churches across America. Filter by denomination and worship style. Visitor guides for every church.`,
  openGraph: {
    title: `Find a Church Near You | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    type: 'website',
    url: `${SITE_URL}/churches`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og/home`,
        width: 1200,
        height: 630,
        alt: 'Find Your Church Home - Psalmlog Church Finder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Find a Church Near You | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og/home`],
  },
};

export default async function ChurchesHomePage() {
  // Fetch dynamic data from database
  let totalChurches = 0;
  let featuredCities: { name: string; state_abbr: string; slug: string; state: string; church_count: number }[] = [];
  let denominationStats: { denomination: string; count: number }[] = [];

  try {
    [totalChurches, featuredCities, denominationStats] = await Promise.all([
      getTotalChurchCount(),
      getFeaturedCitiesWithRealCounts(18),
      getDenominationStats(5),
    ]);
  } catch {
    // Use defaults if database not connected
  }

  // Always use the complete US_STATES list for "Browse by State" section
  // This ensures all 51 states are shown regardless of database state
  const states = US_STATES;

  // Calculate stats for display
  const totalDenominations = denominationStats.length > 0 ? '50+' : '50+';
  const totalStates = '51';

  return (
    <div>
      {/* Hero Section - Dark navy Psalmlog style */}
      <section className="relative bg-[var(--primary)] text-[var(--primary-foreground)]">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden">
          <img
            src="/churches/images/home-hero.png"
            alt="Church interior"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)] via-[var(--primary)]/80 to-transparent" />
        </div>

        <div className="container-page py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight font-serif text-white drop-shadow-md">
              Find Your Church Home
            </h1>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed drop-shadow-sm">
              Discover the right faith community for your life stage, worship style, and spiritual needs—with visitor-friendly information most directories don&apos;t provide.
            </p>

            <div id="search" className="max-w-2xl mx-auto">
              <SearchBox
                placeholder="Search by city or zip code..."
                size="large"
              />
            </div>

            {totalChurches > 0 && (
              <p className="mt-6 text-gray-200 font-medium">
                <span className="font-bold text-white">{totalChurches.toLocaleString()}</span> churches across America
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-[var(--secondary)]">
        <div className="container-page">
          <h2 className="sr-only">Why Use Psalmlog Church Finder</h2>
          <p className="section-label text-center mb-8" aria-hidden="true">Why Use Psalmlog Church Finder</p>
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

      {/* What to Look For Guide */}
      <section className="py-16">
        <div className="container-page">
          <div className="max-w-4xl mx-auto">
            <p className="section-label text-center mb-3">Choosing a Church</p>
            <h2 className="text-2xl font-bold text-center mb-4 font-serif">
              What to Look For in a Church
            </h2>
            <p className="text-center text-[var(--muted)] mb-10 max-w-2xl mx-auto">
              Finding the right church is a personal journey. Here are key factors to consider as you search for a faith community that fits your spiritual needs.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Theological Beliefs</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Does the church&apos;s statement of faith align with your understanding of Scripture? Most churches publish their beliefs on their website, covering topics like salvation, baptism, and spiritual gifts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Worship Style</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Churches range from traditional hymns with organ to contemporary bands with drums and guitars. Some blend both styles. Consider what helps you connect with God most meaningfully.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Community & Size</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Large churches offer more programs and anonymity; smaller churches provide closer relationships. Think about whether you want to know everyone by name or prefer more diverse ministry options.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Baby className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Family Programs</h3>
                    <p className="text-sm text-[var(--muted)]">
                      If you have children, look for age-appropriate ministries like nursery care, children&apos;s church, and youth groups. Check their safety policies and volunteer screening procedures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Serving Opportunities</h3>
                    <p className="text-sm text-[var(--muted)]">
                      A healthy church encourages members to use their gifts. Look for volunteer opportunities that match your interests—from greeting visitors to serving in the community to teaching classes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1 font-serif">Location & Schedule</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Consider drive time and service times. A church close to home makes it easier to attend midweek events and build relationships. Many churches offer multiple service times to fit different schedules.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* First Visit Guide CTA */}
            <FirstVisitGuideCTA />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      {(totalChurches > 0 || denominationStats.length > 0) && (
        <section className="py-16 bg-[var(--secondary)]">
          <div className="container-page">
            <div className="max-w-4xl mx-auto">
              <p className="section-label text-center mb-3">Directory Insights</p>
              <h2 className="text-2xl font-bold text-center mb-4 font-serif">
                Churches Across America
              </h2>
              <p className="text-center text-[var(--muted)] mb-10 max-w-2xl mx-auto">
                Our directory helps you discover faith communities nationwide, spanning all major denominations and worship styles.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-xl p-6 text-center border border-[var(--border)]">
                  <div className="w-12 h-12 bg-[var(--secondary)] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Church className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-3xl font-bold text-[var(--primary)] mb-1">{totalChurches.toLocaleString()}</p>
                  <p className="text-sm text-[var(--muted)]">Churches Listed</p>
                </div>

                <div className="bg-white rounded-xl p-6 text-center border border-[var(--border)]">
                  <div className="w-12 h-12 bg-[var(--secondary)] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-3xl font-bold text-[var(--primary)] mb-1">{totalDenominations}</p>
                  <p className="text-sm text-[var(--muted)]">Denominations</p>
                </div>

                <div className="bg-white rounded-xl p-6 text-center border border-[var(--border)]">
                  <div className="w-12 h-12 bg-[var(--secondary)] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-3xl font-bold text-[var(--primary)] mb-1">{totalStates}</p>
                  <p className="text-sm text-[var(--muted)]">States & DC</p>
                </div>
              </div>

              {denominationStats.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)] mb-4 font-serif text-center">Top Denominations in Our Directory</h3>
                  <div className="space-y-3">
                    {denominationStats.map((stat, index) => (
                      <div key={stat.denomination} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[var(--muted)] w-6">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-[var(--foreground)]">{stat.denomination}</span>
                            <span className="text-sm text-[var(--muted)]">{stat.count.toLocaleString()} churches</span>
                          </div>
                          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full"
                              style={{ width: `${(stat.count / denominationStats[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <HomeFAQSection />

      {/* Psalmlog CTA */}
      <section className="py-16">
        <div className="container-page">
          <PsalmlogCTA variant="bottom" campaign="national_landing" />
        </div>
      </section>
    </div>
  );
}

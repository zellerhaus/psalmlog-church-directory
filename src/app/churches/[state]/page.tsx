import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import SearchBox from '@/components/SearchBox';
import FAQSection from '@/components/FAQSection';
import LocationStats from '@/components/LocationStats';
import HeroImage from '@/components/HeroImage';
import { getChurchCountByState, getCitiesWithChurchCounts, getStateContent } from '@/lib/data';
import { US_STATES, SITE_NAME, SITE_URL, hasEnoughContent } from '@/lib/constants';

const CITIES_PER_PAGE = 40;

interface StatePageProps {
  params: Promise<{ state: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Generate static params for all states
export async function generateStaticParams() {
  return US_STATES.map((state) => ({
    state: state.slug,
  }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);

  if (!stateInfo) {
    return { title: 'State Not Found' };
  }

  // Check if page has enough unique content for indexing
  let shouldIndex = false;
  try {
    const content = await getStateContent(stateInfo.abbr);
    shouldIndex = hasEnoughContent(content?.overview, content?.visitor_guide, content?.historical_context);
  } catch {
    // Database not available, default to noindex for safety
  }

  const canonicalUrl = `${SITE_URL}/churches/${stateSlug}`;
  const title = `Churches in ${stateInfo.name}`;
  const description = `Find churches in ${stateInfo.name}. Browse by city, denomination, and worship style.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    // Noindex pages with thin content to avoid SEO penalties
    ...(shouldIndex ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/og/state/${stateSlug}`,
          width: 1200,
          height: 630,
          alt: `Churches in ${stateInfo.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og/state/${stateSlug}`],
    },
  };
}

// BreadcrumbList Schema
function BreadcrumbSchema({ stateInfo, stateSlug }: { stateInfo: typeof US_STATES[number]; stateSlug: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Churches',
        item: `${SITE_URL}/churches`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: stateInfo.name,
        item: `${SITE_URL}/churches/${stateSlug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function StatePage({ params, searchParams }: StatePageProps) {
  const { state: stateSlug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);

  // Find state info from constants
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);

  if (!stateInfo) {
    notFound();
  }

  // Get real church counts from the churches table
  let totalChurches = 0;
  let cities: { slug: string; name: string; church_count: number }[] = [];
  let content: Awaited<ReturnType<typeof getStateContent>> = null;

  try {
    // Get total church count for the state
    totalChurches = await getChurchCountByState(stateInfo.abbr);

    // Get cities with real church counts (aggregated from churches)
    cities = await getCitiesWithChurchCounts(stateInfo.abbr);

    // Get pre-generated content for this state
    content = await getStateContent(stateInfo.abbr);
  } catch {
    // Database not connected, use empty state
  }

  return (
    <>
      <BreadcrumbSchema stateInfo={stateInfo} stateSlug={stateSlug} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[{ label: stateInfo.name }]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          {/* Background Image with Dark Overlay - uses state-specific image if available */}
          <div className="absolute inset-0 z-0 select-none">
            <HeroImage
              src={`/churches/images/states/${stateSlug}.png`}
              fallbackSrc="/churches/images/state-hero.png"
              alt={`${stateInfo.name} landscape`}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white shadow-sm">
              Churches in {stateInfo.name}
            </h1>

            {/* AI-generated overview or fallback */}
            {content?.overview ? (
              <div className="prose prose-lg max-w-none mb-6">
                <p className="text-lg text-gray-100 leading-relaxed shadow-sm">
                  {content.overview}
                </p>
              </div>
            ) : (
              <p className="text-lg text-gray-100 mb-6 shadow-sm">
                {totalChurches > 0
                  ? `Find ${totalChurches.toLocaleString()} churches across ${cities.length} cities in ${stateInfo.name}.`
                  : `Browse churches across ${stateInfo.name}.`}
              </p>
            )}

            <SearchBox
              placeholder={`Search churches in ${stateInfo.name}...`}
              className="max-w-xl shadow-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Statistics Summary */}
            {content?.stats && (
              <LocationStats stats={content.stats} locationName={stateInfo.name} />
            )}

            {/* City Grid */}
            {cities.length > 0 ? (
              <>
                {(() => {
                  const totalPages = Math.ceil(cities.length / CITIES_PER_PAGE);
                  const startIndex = (currentPage - 1) * CITIES_PER_PAGE;
                  const endIndex = startIndex + CITIES_PER_PAGE;
                  const paginatedCities = cities.slice(startIndex, endIndex);
                  const showPagination = totalPages > 1;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Cities in {stateInfo.name}</h2>
                        {showPagination && (
                          <p className="text-sm text-[var(--muted)]">
                            Showing {startIndex + 1}-{Math.min(endIndex, cities.length)} of {cities.length} cities
                          </p>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {paginatedCities.map((city) => (
                          <Link
                            key={city.slug}
                            href={`/churches/${stateSlug}/${city.slug}`}
                            className="card p-4 hover:border-[var(--primary)]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                              </div>
                              <div>
                                <h3 className="font-medium text-[var(--foreground)]">{city.name}</h3>
                                <p className="text-sm text-[var(--primary)]">
                                  {city.church_count} church{city.church_count !== 1 ? 'es' : ''}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {showPagination && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          {currentPage > 1 ? (
                            <Link
                              href={`/churches/${stateSlug}${currentPage === 2 ? '' : `?page=${currentPage - 1}`}`}
                              className="flex items-center gap-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1 px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--muted)] cursor-not-allowed">
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                              // Show first, last, current, and neighbors
                              const showPage =
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                Math.abs(pageNum - currentPage) <= 1;
                              const showEllipsis =
                                (pageNum === 2 && currentPage > 3) ||
                                (pageNum === totalPages - 1 && currentPage < totalPages - 2);

                              if (!showPage && !showEllipsis) return null;
                              if (showEllipsis && !showPage) {
                                return (
                                  <span key={pageNum} className="px-2 text-[var(--muted)]">
                                    ...
                                  </span>
                                );
                              }

                              return (
                                <Link
                                  key={pageNum}
                                  href={`/churches/${stateSlug}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
                                  className={`px-3 py-2 rounded-lg transition-colors ${
                                    pageNum === currentPage
                                      ? 'bg-[var(--primary)] text-white'
                                      : 'hover:bg-[var(--secondary)]'
                                  }`}
                                >
                                  {pageNum}
                                </Link>
                              );
                            })}
                          </div>

                          {currentPage < totalPages ? (
                            <Link
                              href={`/churches/${stateSlug}?page=${currentPage + 1}`}
                              className="flex items-center gap-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1 px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--muted)] cursor-not-allowed">
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-12 bg-[var(--secondary)] rounded-lg">
                <MapPin className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p className="text-lg font-medium text-[var(--foreground)] mb-2">
                  No cities found yet
                </p>
                <p className="text-[var(--muted)] max-w-md mx-auto">
                  We&apos;re still building our database for {stateInfo.name}.
                  Check back soon or try searching for a specific city.
                </p>
              </div>
            )}

            {/* Visitor Guide Section */}
            {content?.visitor_guide && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                  Visiting Churches in {stateInfo.name}
                </h2>
                <div className="prose max-w-none text-[var(--muted)]">
                  {content.visitor_guide.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Historical Context Section */}
            {content?.historical_context && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                  Church History in {stateInfo.name}
                </h2>
                <div className="prose max-w-none text-[var(--muted)]">
                  {content.historical_context.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ Section with Schema Markup */}
            {content?.faqs && content.faqs.length > 0 && (
              <FAQSection
                faqs={content.faqs}
                title={`Frequently Asked Questions About Churches in ${stateInfo.name}`}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <PsalmlogCTA variant="sidebar" campaign="state_page" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="state_page" />
        </div>
      </div>
    </>
  );
}

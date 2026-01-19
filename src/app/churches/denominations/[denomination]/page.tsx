import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Church } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChurchCard from '@/components/ChurchCard';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import {
  getChurchesByDenomination,
  getDenominationStatsByState,
  getChurchCountByDenomination,
} from '@/lib/data';
import {
  DENOMINATION_SLUGS,
  getDenominationSlugs,
  US_STATES,
  SITE_NAME,
  SITE_URL,
  DEFAULT_PAGE_SIZE,
} from '@/lib/constants';

const CHURCHES_PER_PAGE = 20;

interface DenominationPageProps {
  params: Promise<{ denomination: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Generate static params for all denominations
export async function generateStaticParams() {
  return getDenominationSlugs().map((denomination) => ({
    denomination,
  }));
}

export async function generateMetadata({ params }: DenominationPageProps): Promise<Metadata> {
  const { denomination: slug } = await params;
  const denominationName = DENOMINATION_SLUGS[slug];

  if (!denominationName) {
    return { title: 'Denomination Not Found' };
  }

  let churchCount = 0;
  try {
    churchCount = await getChurchCountByDenomination(denominationName);
  } catch {
    // Database not available
  }

  const canonicalUrl = `${SITE_URL}/churches/denominations/${slug}`;
  const title = `${denominationName} Churches`;
  const description = churchCount > 0
    ? `Find ${churchCount.toLocaleString()} ${denominationName} churches across the United States. Browse by state, get visitor guides, and find your church home.`
    : `Find ${denominationName} churches across the United States. Browse by state and get visitor guides.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/og/home`,
          width: 1200,
          height: 630,
          alt: `${denominationName} Churches`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og/home`],
    },
  };
}

// BreadcrumbList Schema
function BreadcrumbSchema({ denominationName, slug }: { denominationName: string; slug: string }) {
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
        name: 'Denominations',
        item: `${SITE_URL}/churches/denominations`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: denominationName,
        item: `${SITE_URL}/churches/denominations/${slug}`,
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

// Helper to get state slug from abbreviation
function getStateSlug(abbr: string): string {
  const state = US_STATES.find((s) => s.abbr === abbr);
  return state?.slug || abbr.toLowerCase();
}

// Helper to generate city slug
function getCitySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-');
}

// Helper to get state name from abbreviation
function getStateName(abbr: string): string {
  const state = US_STATES.find((s) => s.abbr === abbr);
  return state?.name || abbr;
}

export default async function DenominationPage({ params, searchParams }: DenominationPageProps) {
  const { denomination: slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);

  // Find denomination name from slug
  const denominationName = DENOMINATION_SLUGS[slug];

  if (!denominationName) {
    notFound();
  }

  // Fetch data
  let totalChurches = 0;
  let stateStats: { state_abbr: string; state: string; count: number }[] = [];
  let churches: Awaited<ReturnType<typeof getChurchesByDenomination>> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  };

  try {
    totalChurches = await getChurchCountByDenomination(denominationName);
    stateStats = await getDenominationStatsByState(denominationName);
    churches = await getChurchesByDenomination(denominationName, currentPage, CHURCHES_PER_PAGE);
  } catch {
    // Database not connected
  }

  const totalPages = churches.totalPages;
  const showPagination = totalPages > 1;

  return (
    <>
      <BreadcrumbSchema denominationName={denominationName} slug={slug} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Denominations', href: '/churches/denominations' },
            { label: denominationName },
          ]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              {denominationName} Churches
            </h1>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Discover ${totalChurches.toLocaleString()} ${denominationName} churches across ${stateStats.length} states. Find a faith community that matches your beliefs and worship preferences.`
                : `Find ${denominationName} churches across the United States.`}
            </p>

            <SearchBox
              placeholder={`Search ${denominationName} churches...`}
              className="max-w-xl shadow-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* States Grid */}
            {stateStats.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                  {denominationName} Churches by State
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {stateStats.slice(0, 12).map((stat) => (
                    <Link
                      key={stat.state_abbr}
                      href={`/churches/${getStateSlug(stat.state_abbr)}?denomination=${encodeURIComponent(denominationName)}`}
                      className="card p-4 hover:border-[var(--primary)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-[var(--foreground)]">
                            {getStateName(stat.state_abbr)}
                          </h3>
                          <p className="text-sm text-[var(--primary)]">
                            {stat.count.toLocaleString()} church{stat.count !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {stateStats.length > 12 && (
                  <p className="text-sm text-[var(--muted)] mt-4">
                    Showing top 12 states. Search above to find churches in other states.
                  </p>
                )}
              </section>
            )}

            {/* Church Listings */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {denominationName} Church Listings
                </h2>
                {showPagination && (
                  <p className="text-sm text-[var(--muted)]">
                    Showing {((currentPage - 1) * CHURCHES_PER_PAGE) + 1}-{Math.min(currentPage * CHURCHES_PER_PAGE, churches.total)} of {churches.total.toLocaleString()}
                  </p>
                )}
              </div>

              {churches.data.length > 0 ? (
                <>
                  <div className="grid gap-4">
                    {churches.data.map((church, index) => (
                      <Fragment key={church.id}>
                        <ChurchCard
                          church={church}
                          stateSlug={getStateSlug(church.state_abbr)}
                          citySlug={getCitySlug(church.city)}
                        />
                        {/* Insert inline CTA after 5th result */}
                        {index === 4 && churches.data.length > 5 && (
                          <PsalmlogCTA variant="inline" campaign="denomination_page" />
                        )}
                      </Fragment>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {showPagination && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {currentPage > 1 ? (
                        <Link
                          href={`/churches/denominations/${slug}${currentPage === 2 ? '' : `?page=${currentPage - 1}`}`}
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
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }

                          return (
                            <Link
                              key={pageNum}
                              href={`/churches/denominations/${slug}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
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
                          href={`/churches/denominations/${slug}?page=${currentPage + 1}`}
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
              ) : (
                <div className="text-center py-12 bg-[var(--secondary)] rounded-lg">
                  <Church className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                  <p className="text-lg font-medium text-[var(--foreground)] mb-2">
                    No churches found
                  </p>
                  <p className="text-[var(--muted)] max-w-md mx-auto">
                    We&apos;re still building our {denominationName} church database.
                    Check back soon or try searching for a specific location.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 self-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <FirstVisitGuideCTA variant="sidebar" />
              <PsalmlogCTA variant="sidebar" campaign="denomination_page" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="denomination_page" />
        </div>
      </div>
    </>
  );
}

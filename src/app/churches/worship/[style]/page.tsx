import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Music } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChurchCard from '@/components/ChurchCard';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import {
  getChurchesByWorshipStyle,
  getWorshipStyleStatsByState,
  getChurchCountByWorshipStyle,
} from '@/lib/data';
import {
  WORSHIP_STYLE_SLUGS,
  getWorshipStyleSlugs,
  US_STATES,
  SITE_NAME,
  SITE_URL,
  DEFAULT_PAGE_SIZE,
} from '@/lib/constants';

const CHURCHES_PER_PAGE = 20;

// Worship style descriptions for SEO content
const WORSHIP_STYLE_DESCRIPTIONS: Record<string, { short: string; long: string }> = {
  'Contemporary': {
    short: 'modern worship music, casual atmosphere, and engaging multimedia presentations',
    long: 'Contemporary worship services feature modern Christian music with full bands, casual dress codes, and engaging multimedia presentations. These churches often appeal to younger generations and those seeking a more relaxed worship experience.',
  },
  'Traditional': {
    short: 'classic hymns, formal liturgy, and time-honored worship practices',
    long: 'Traditional worship services feature classic hymns, formal liturgy, and reverent atmosphere. These churches honor centuries-old worship practices and often include organ music, choirs, and structured order of service.',
  },
  'Blended': {
    short: 'a mix of contemporary and traditional elements in worship',
    long: 'Blended worship combines the best of contemporary and traditional styles. These services may include both hymns and modern worship songs, appealing to multigenerational congregations seeking variety in their worship experience.',
  },
  'Liturgical': {
    short: 'structured services with creeds, responsive readings, and sacraments',
    long: 'Liturgical worship follows a structured order of service including creeds, responsive readings, and regular celebration of sacraments. Common in Catholic, Episcopal, Lutheran, and Orthodox traditions.',
  },
  'Gospel': {
    short: 'energetic, choir-driven worship with expressive celebration',
    long: 'Gospel worship features energetic, choir-driven services with expressive celebration and soulful music. Rooted in African American church traditions, these services emphasize joy, community, and heartfelt praise.',
  },
  'Charismatic': {
    short: 'Spirit-led worship emphasizing spiritual gifts and expressive praise',
    long: 'Charismatic worship emphasizes the work of the Holy Spirit, spiritual gifts, and expressive praise. These services often include extended worship times, prayer ministry, and spontaneous expressions of faith.',
  },
};

interface WorshipStylePageProps {
  params: Promise<{ style: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Generate static params for all worship styles
export async function generateStaticParams() {
  return getWorshipStyleSlugs().map((style) => ({
    style,
  }));
}

export async function generateMetadata({ params }: WorshipStylePageProps): Promise<Metadata> {
  const { style: slug } = await params;
  const styleName = WORSHIP_STYLE_SLUGS[slug];

  if (!styleName) {
    return { title: 'Worship Style Not Found' };
  }

  let churchCount = 0;
  try {
    churchCount = await getChurchCountByWorshipStyle(styleName);
  } catch {
    // Database not available
  }

  const styleInfo = WORSHIP_STYLE_DESCRIPTIONS[styleName];
  const canonicalUrl = `${SITE_URL}/churches/worship/${slug}`;
  const title = `${styleName} Worship Churches`;
  const description = churchCount > 0
    ? `Find ${churchCount.toLocaleString()} churches with ${styleName.toLowerCase()} worship - ${styleInfo?.short || 'a unique worship experience'}. Browse by state and get visitor guides.`
    : `Find churches with ${styleName.toLowerCase()} worship across the United States.`;

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
          alt: `${styleName} Worship Churches`,
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
function BreadcrumbSchema({ styleName, slug }: { styleName: string; slug: string }) {
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
        name: 'Worship Styles',
        item: `${SITE_URL}/churches/worship`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: styleName,
        item: `${SITE_URL}/churches/worship/${slug}`,
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

export default async function WorshipStylePage({ params, searchParams }: WorshipStylePageProps) {
  const { style: slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);

  // Find worship style name from slug
  const styleName = WORSHIP_STYLE_SLUGS[slug];

  if (!styleName) {
    notFound();
  }

  const styleInfo = WORSHIP_STYLE_DESCRIPTIONS[styleName];

  // Fetch data
  let totalChurches = 0;
  let stateStats: { state_abbr: string; state: string; count: number }[] = [];
  let churches: Awaited<ReturnType<typeof getChurchesByWorshipStyle>> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  };

  try {
    totalChurches = await getChurchCountByWorshipStyle(styleName);
    stateStats = await getWorshipStyleStatsByState(styleName);
    churches = await getChurchesByWorshipStyle(styleName, currentPage, CHURCHES_PER_PAGE);
  } catch {
    // Database not connected
  }

  const totalPages = churches.totalPages;
  const showPagination = totalPages > 1;

  return (
    <>
      <BreadcrumbSchema styleName={styleName} slug={slug} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Worship Styles', href: '/churches/worship' },
            { label: styleName },
          ]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              {styleName} Worship Churches
            </h1>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Discover ${totalChurches.toLocaleString()} churches with ${styleName.toLowerCase()} worship across ${stateStats.length} states. ${styleInfo?.short ? `Experience ${styleInfo.short}.` : ''}`
                : `Find churches with ${styleName.toLowerCase()} worship across the United States.`}
            </p>

            <SearchBox
              placeholder={`Search ${styleName.toLowerCase()} worship churches...`}
              className="max-w-xl shadow-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* About This Worship Style */}
            {styleInfo?.long && (
              <section className="mb-8 p-6 bg-[var(--secondary)] rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-[var(--foreground)]">
                  About {styleName} Worship
                </h2>
                <p className="text-[var(--muted)] leading-relaxed">
                  {styleInfo.long}
                </p>
              </section>
            )}

            {/* States Grid */}
            {stateStats.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                  {styleName} Churches by State
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {stateStats.slice(0, 12).map((stat) => (
                    <Link
                      key={stat.state_abbr}
                      href={`/churches/${getStateSlug(stat.state_abbr)}?worship_style=${encodeURIComponent(styleName)}`}
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
                  {styleName} Church Listings
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
                          <PsalmlogCTA variant="inline" campaign="worship_style_page" />
                        )}
                      </Fragment>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {showPagination && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {currentPage > 1 ? (
                        <Link
                          href={`/churches/worship/${slug}${currentPage === 2 ? '' : `?page=${currentPage - 1}`}`}
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
                              href={`/churches/worship/${slug}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
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
                          href={`/churches/worship/${slug}?page=${currentPage + 1}`}
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
                  <Music className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                  <p className="text-lg font-medium text-[var(--foreground)] mb-2">
                    No churches found
                  </p>
                  <p className="text-[var(--muted)] max-w-md mx-auto">
                    We&apos;re still building our database of churches with {styleName.toLowerCase()} worship.
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
              <PsalmlogCTA variant="sidebar" campaign="worship_style_page" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="worship_style_page" />
        </div>
      </div>
    </>
  );
}

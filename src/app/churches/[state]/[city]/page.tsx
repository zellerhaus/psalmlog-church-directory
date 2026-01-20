import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment, Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChurchCard from '@/components/ChurchCard';
import Filters from '@/components/Filters';
import Pagination from '@/components/Pagination';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import FAQSection from '@/components/FAQSection';
import LocationStats from '@/components/LocationStats';
import { getCityBySlug, getChurchesByCity, getCityContent } from '@/lib/data';
import { US_STATES, SITE_NAME, SITE_URL, DEFAULT_PAGE_SIZE, hasEnoughContent } from '@/lib/constants';
import type { ChurchFilters, Church, PaginatedResult } from '@/types/database';

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Revalidate city pages every 24 hours (ISR)
export const revalidate = 86400;

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;

  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    return { title: 'City Not Found' };
  }

  // Format city name from slug
  const cityName = citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Check if page has enough unique content for indexing
  let shouldIndex = false;
  try {
    const content = await getCityContent(stateInfo.abbr, citySlug);
    shouldIndex = hasEnoughContent(content?.overview, content?.visitor_guide, content?.community_insights);
  } catch {
    // Database not available, default to noindex for safety
  }

  const canonicalUrl = `${SITE_URL}/churches/${stateSlug}/${citySlug}`;
  const title = `Churches in ${cityName}, ${stateInfo.abbr}`;
  const description = `Find churches in ${cityName}, ${stateInfo.name}. Filter by denomination and worship style.`;

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
          url: `${SITE_URL}/og/city/${stateSlug}/${citySlug}`,
          width: 1200,
          height: 630,
          alt: `Churches in ${cityName}, ${stateInfo.abbr}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og/city/${stateSlug}/${citySlug}`],
    },
  };
}

// Generate dynamic overview text from stats
function generateOverview(
  cityName: string,
  stats: {
    church_count: number;
    denominations: Record<string, number>;
    programs: { kids_ministry: number; youth_group: number; small_groups: number }
  } | null | undefined
): string | null {
  if (!stats || stats.church_count === 0) return null;

  const { church_count, denominations, programs } = stats;

  // Find top denomination
  const topDenom = Object.entries(denominations)
    .sort((a, b) => b[1] - a[1])[0];

  // Calculate percentages
  const kidsPercent = Math.round((programs.kids_ministry / church_count) * 100);
  const groupsPercent = Math.round((programs.small_groups / church_count) * 100);

  // Build overview
  let overview = `Whether you're new to ${cityName} or searching for a new church home, you'll discover ${church_count} welcoming congregation${church_count !== 1 ? 's' : ''} in the area.`;

  if (topDenom && topDenom[1] > 1) {
    overview += ` ${topDenom[0]} churches lead with ${topDenom[1]} locations.`;
  }

  if (kidsPercent > 0 || groupsPercent > 0) {
    const parts = [];
    if (kidsPercent > 0) parts.push(`${kidsPercent}% offer children's programs`);
    if (groupsPercent > 0) parts.push(`${groupsPercent}% have small group ministries for deeper fellowship`);
    overview += ` ${parts.join(', and ')}.`;
  }

  return overview;
}

// BreadcrumbList Schema
function BreadcrumbSchema({
  stateInfo,
  stateSlug,
  cityName,
  citySlug
}: {
  stateInfo: typeof US_STATES[number];
  stateSlug: string;
  cityName: string;
  citySlug: string;
}) {
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
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `${SITE_URL}/churches/${stateSlug}/${citySlug}`,
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

async function ChurchList({
  stateAbbr,
  stateSlug,
  citySlug,
  cityName,
  searchParams,
}: {
  stateAbbr: string;
  stateSlug: string;
  citySlug: string;
  cityName: string;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Build filters from search params
  const filters: ChurchFilters = {};
  if (typeof searchParams.denomination === 'string') {
    filters.denomination = searchParams.denomination;
  }
  if (typeof searchParams.worship_style === 'string') {
    filters.worship_style = searchParams.worship_style;
  }
  if (searchParams.kids === 'true') {
    filters.has_kids_ministry = true;
  }
  if (searchParams.youth === 'true') {
    filters.has_youth_group = true;
  }
  if (searchParams.groups === 'true') {
    filters.has_small_groups = true;
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;

  let result: PaginatedResult<Church> = { data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0 };

  try {
    result = await getChurchesByCity(stateAbbr, cityName, filters, page);
  } catch {
    // Database not connected
  }

  if (result.data.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--secondary)] rounded-lg">
        <p className="text-lg font-medium text-[var(--foreground)] mb-2">
          No churches found
        </p>
        <p className="text-[var(--muted)]">
          Try adjusting your filters or check back later as we add more churches.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {result.data.map((church, index) => (
          <Fragment key={church.id}>
            <ChurchCard
              church={church}
              stateSlug={stateSlug}
              citySlug={citySlug}
            />
            {/* Insert inline CTA after 5th result */}
            {index === 4 && result.data.length > 5 && (
              <PsalmlogCTA variant="inline" campaign="city_page" />
            )}
          </Fragment>
        ))}
      </div>

      <Pagination
        currentPage={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </>
  );
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params;
  const resolvedSearchParams = await searchParams;

  // Find state info
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    notFound();
  }

  // Format city name from slug (fallback if not in database)
  let cityName = citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  let cityData = null;
  let totalChurchCount = 0;
  let content: Awaited<ReturnType<typeof getCityContent>> = null;

  try {
    cityData = await getCityBySlug(stateInfo.abbr, citySlug);
    if (cityData) {
      cityName = cityData.name;
    }

    // Get real church count by querying the churches table (no filters, page 1)
    const countResult = await getChurchesByCity(stateInfo.abbr, cityName, {}, 1, 1);
    totalChurchCount = countResult.total;

    // Get pre-generated content for this city
    content = await getCityContent(stateInfo.abbr, citySlug);
  } catch {
    // Database not connected
  }

  return (
    <>
      <BreadcrumbSchema
        stateInfo={stateInfo}
        stateSlug={stateSlug}
        cityName={cityName}
        citySlug={citySlug}
      />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: stateInfo.name, href: `/churches/${stateSlug}` },
            { label: cityName },
          ]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-10 md:py-12 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0 select-none">
            <img
              src="/churches/images/city-hero.png"
              alt="Cityscape"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 font-serif text-white shadow-sm">
              Churches in {cityName}, {stateInfo.abbr}
            </h1>

            {/* Dynamic overview from stats */}
            {(() => {
              const overview = generateOverview(cityName, content?.stats);
              return overview ? (
                <div className="prose prose-lg max-w-none mb-4">
                  <p className="text-lg text-gray-100 leading-relaxed shadow-sm">
                    {overview}
                  </p>
                </div>
              ) : totalChurchCount > 0 ? (
                <p className="text-lg text-gray-100 shadow-sm">
                  {totalChurchCount} church{totalChurchCount !== 1 ? 'es' : ''} found
                </p>
              ) : null;
            })()}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Statistics Summary */}
            {content?.stats && (
              <LocationStats
                stats={content.stats}
                locationName={cityName}
                compact={true}
              />
            )}

            <Suspense fallback={<div>Loading filters...</div>}>
              <Filters />
            </Suspense>

            <Suspense fallback={<div className="animate-pulse">Loading churches...</div>}>
              <ChurchList
                stateAbbr={stateInfo.abbr}
                stateSlug={stateSlug}
                citySlug={citySlug}
                cityName={cityName}
                searchParams={resolvedSearchParams}
              />
            </Suspense>

            {/* Visitor Guide Section */}
            {content?.visitor_guide && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                  What to Expect Visiting Churches in {cityName}
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

            {/* Community Insights Section */}
            {content?.community_insights && (
              <section className="mt-8">
                <h2 className="text-xl font-bold mb-4 font-serif text-[var(--foreground)]">
                  Church Community in {cityName}
                </h2>
                <div className="prose max-w-none text-[var(--muted)]">
                  <p className="leading-relaxed">{content.community_insights}</p>
                </div>
              </section>
            )}

            {/* FAQ Section with Schema Markup */}
            {content?.faqs && content.faqs.length > 0 && (
              <FAQSection
                faqs={content.faqs}
                title={`FAQs About Churches in ${cityName}`}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 self-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <FirstVisitGuideCTA variant="sidebar" />
              <PsalmlogCTA variant="sidebar" campaign="city_page" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="bottom" campaign="city_page" />
        </div>
      </div>
    </>
  );
}

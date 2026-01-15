import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment, Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChurchCard from '@/components/ChurchCard';
import Filters from '@/components/Filters';
import Pagination from '@/components/Pagination';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FAQSection from '@/components/FAQSection';
import LocationStats from '@/components/LocationStats';
import { getCityBySlug, getChurchesByCity, getCityContent } from '@/lib/data';
import { US_STATES, SITE_NAME, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { ChurchFilters, Church, PaginatedResult } from '@/types/database';

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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

  return {
    title: `Churches in ${cityName}, ${stateInfo.abbr} | ${SITE_NAME}`,
    description: `Discover churches in ${cityName}, ${stateInfo.name}. Filter by denomination, worship style. First-time visitor info for every church.`,
    openGraph: {
      title: `Churches in ${cityName}, ${stateInfo.abbr} | ${SITE_NAME}`,
      description: `Discover churches in ${cityName}, ${stateInfo.name}. Filter by denomination, worship style. First-time visitor info for every church.`,
    },
  };
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
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
          No churches found
        </h3>
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
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: stateInfo.name, href: `/churches/${stateSlug}` },
          { label: cityName },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2 font-serif">
          Churches in {cityName}, {stateInfo.abbr}
        </h1>

        {/* AI-generated overview or fallback */}
        {content?.overview ? (
          <div className="prose prose-lg max-w-none mb-4">
            <p className="text-lg text-[var(--muted)] leading-relaxed">
              {content.overview}
            </p>
          </div>
        ) : totalChurchCount > 0 ? (
          <p className="text-lg text-[var(--muted)]">
            {totalChurchCount} church{totalChurchCount !== 1 ? 'es' : ''} found
          </p>
        ) : null}
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
        <div className="lg:col-span-1">
          <PsalmlogCTA variant="sidebar" campaign="city_page" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12">
        <PsalmlogCTA variant="bottom" campaign="city_page" />
      </div>
    </div>
  );
}

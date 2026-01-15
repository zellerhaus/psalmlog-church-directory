import { Metadata } from 'next';
import { Fragment, Suspense } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import SearchBox from '@/components/SearchBox';
import ChurchCard from '@/components/ChurchCard';
import Filters from '@/components/Filters';
import Pagination from '@/components/Pagination';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import Breadcrumbs from '@/components/Breadcrumbs';
import { searchChurches } from '@/lib/data';
import { SITE_NAME, DEFAULT_PAGE_SIZE, US_STATES } from '@/lib/constants';
import type { ChurchFilters, Church, PaginatedResult } from '@/types/database';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';

  if (query) {
    return {
      title: `Search Results for "${query}"`,
      description: `Find churches matching "${query}". Filter by denomination and worship style.`,
    };
  }

  return {
    title: `Search Churches`,
    description: 'Search for churches by city, zip code, or name. Filter by denomination and worship style.',
  };
}

async function SearchResults({
  query,
  searchParams,
}: {
  query: string;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!query) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Search for churches
        </p>
        <p className="text-gray-600 max-w-md mx-auto">
          Enter a city name or zip code to find churches near you.
        </p>
      </div>
    );
  }

  // Build filters
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
    result = await searchChurches(query, filters, page);
  } catch {
    // Database not connected
  }

  if (result.data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          No churches found for &quot;{query}&quot;
        </p>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Try a different search term or browse by state.
        </p>
        <Link href="/churches" className="btn-primary">
          Browse All Churches
        </Link>
      </div>
    );
  }

  // Helper to get state slug from abbreviation
  const getStateSlug = (abbr: string) => {
    const state = US_STATES.find((s) => s.abbr === abbr);
    return state?.slug || abbr.toLowerCase();
  };

  // Helper to generate city slug
  const getCitySlug = (city: string) => {
    return city.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <>
      <p className="text-gray-600 mb-6">
        Found {result.total.toLocaleString()} church{result.total !== 1 ? 'es' : ''} matching &quot;{query}&quot;
      </p>

      <div className="grid gap-4">
        {result.data.map((church, index) => (
          <Fragment key={church.id}>
            <ChurchCard
              church={church}
              stateSlug={getStateSlug(church.state_abbr)}
              citySlug={getCitySlug(church.city)}
            />
            {/* Insert inline CTA after 5th result */}
            {index === 4 && result.data.length > 5 && (
              <PsalmlogCTA variant="inline" campaign="search_results" />
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Search' }]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {query ? `Search Results for "${query}"` : 'Search Churches'}
        </h1>

        <SearchBox
          placeholder="Search by city or zip code..."
          className="max-w-xl"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3">
          {query && (
            <Suspense fallback={<div>Loading filters...</div>}>
              <Filters />
            </Suspense>
          )}

          <Suspense fallback={<div className="animate-pulse">Searching...</div>}>
            <SearchResults query={query} searchParams={params} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <PsalmlogCTA variant="sidebar" campaign="search_page" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12">
        <PsalmlogCTA variant="bottom" campaign="search_page" />
      </div>
    </div>
  );
}

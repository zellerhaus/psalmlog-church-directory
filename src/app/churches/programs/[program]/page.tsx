import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Users, Baby, Heart } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChurchCard from '@/components/ChurchCard';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import {
  getChurchesByProgram,
  getProgramStatsByState,
  getChurchCountByProgram,
} from '@/lib/data';
import {
  PROGRAM_SLUGS,
  getProgramSlugs,
  US_STATES,
  SITE_NAME,
  SITE_URL,
  DEFAULT_PAGE_SIZE,
} from '@/lib/constants';

const CHURCHES_PER_PAGE = 20;

// Program descriptions and icons
const PROGRAM_INFO: Record<string, { description: string; longDescription: string; icon: React.ReactNode }> = {
  'kids-ministry': {
    description: 'dedicated children\'s programming during services',
    longDescription: 'Kids Ministry programs provide age-appropriate Bible teaching, activities, and care for children during church services. These programs help children learn about faith in engaging ways while parents worship. Look for churches with safe check-in procedures, trained volunteers, and curriculum designed for different age groups from nursery through elementary school.',
    icon: <Baby className="w-6 h-6 text-[var(--primary)]" />,
  },
  'youth-group': {
    description: 'programs for middle and high school students',
    longDescription: 'Youth Group programs serve teenagers through middle and high school years, providing a community where they can grow in faith alongside peers. Activities typically include Bible study, worship, games, service projects, and retreats. Strong youth ministries help teens navigate the challenges of adolescence with spiritual guidance and meaningful friendships.',
    icon: <Users className="w-6 h-6 text-[var(--primary)]" />,
  },
  'small-groups': {
    description: 'intimate gatherings for fellowship and Bible study',
    longDescription: 'Small Groups (also called life groups, home groups, or cell groups) are intimate gatherings where members meet regularly for Bible study, prayer, and fellowship. These groups help build deeper relationships and provide support during life\'s challenges. They\'re an excellent way to connect with a church community beyond Sunday services.',
    icon: <Heart className="w-6 h-6 text-[var(--primary)]" />,
  },
};

interface ProgramPageProps {
  params: Promise<{ program: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Generate static params for all programs
export async function generateStaticParams() {
  return getProgramSlugs().map((program) => ({
    program,
  }));
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { program: slug } = await params;
  const programData = PROGRAM_SLUGS[slug];

  if (!programData) {
    return { title: 'Program Not Found' };
  }

  let churchCount = 0;
  try {
    churchCount = await getChurchCountByProgram(programData.field);
  } catch {
    // Database not available
  }

  const info = PROGRAM_INFO[slug];
  const canonicalUrl = `${SITE_URL}/churches/programs/${slug}`;
  const title = `Churches with ${programData.name}`;
  const description = churchCount > 0
    ? `Find ${churchCount.toLocaleString()} churches with ${programData.name.toLowerCase()} - ${info?.description || 'specialized ministry programs'}. Browse by state and get visitor guides.`
    : `Find churches with ${programData.name.toLowerCase()} across the United States.`;

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
          alt: `Churches with ${programData.name}`,
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
function BreadcrumbSchema({ programName, slug }: { programName: string; slug: string }) {
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
        name: 'Programs',
        item: `${SITE_URL}/churches/programs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: programName,
        item: `${SITE_URL}/churches/programs/${slug}`,
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

// Helper to get URL param name for program filter
function getProgramFilterParam(slug: string): string {
  switch (slug) {
    case 'kids-ministry':
      return 'kids=true';
    case 'youth-group':
      return 'youth=true';
    case 'small-groups':
      return 'groups=true';
    default:
      return '';
  }
}

export default async function ProgramPage({ params, searchParams }: ProgramPageProps) {
  const { program: slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);

  // Find program data from slug
  const programData = PROGRAM_SLUGS[slug];

  if (!programData) {
    notFound();
  }

  const info = PROGRAM_INFO[slug];

  // Fetch data
  let totalChurches = 0;
  let stateStats: { state_abbr: string; state: string; count: number }[] = [];
  let churches: Awaited<ReturnType<typeof getChurchesByProgram>> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  };

  try {
    totalChurches = await getChurchCountByProgram(programData.field);
    stateStats = await getProgramStatsByState(programData.field);
    churches = await getChurchesByProgram(programData.field, currentPage, CHURCHES_PER_PAGE);
  } catch {
    // Database not connected
  }

  const totalPages = churches.totalPages;
  const showPagination = totalPages > 1;
  const filterParam = getProgramFilterParam(slug);

  return (
    <>
      <BreadcrumbSchema programName={programData.name} slug={slug} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Programs', href: '/churches/programs' },
            { label: programData.name },
          ]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                {info?.icon || <Users className="w-7 h-7 text-white" />}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-white">
                Churches with {programData.name}
              </h1>
            </div>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Discover ${totalChurches.toLocaleString()} churches with ${programData.name.toLowerCase()} across ${stateStats.length} states. ${info?.description ? `Find churches offering ${info.description}.` : ''}`
                : `Find churches with ${programData.name.toLowerCase()} across the United States.`}
            </p>

            <SearchBox
              placeholder={`Search churches with ${programData.name.toLowerCase()}...`}
              className="max-w-xl shadow-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* About This Program */}
            {info?.longDescription && (
              <section className="mb-8 p-6 bg-[var(--secondary)] rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-[var(--foreground)]">
                  About {programData.name}
                </h2>
                <p className="text-[var(--muted)] leading-relaxed">
                  {info.longDescription}
                </p>
              </section>
            )}

            {/* States Grid */}
            {stateStats.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-4">
                  Churches with {programData.name} by State
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {stateStats.slice(0, 12).map((stat) => (
                    <Link
                      key={stat.state_abbr}
                      href={`/churches/${getStateSlug(stat.state_abbr)}?${filterParam}`}
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
                  Church Listings with {programData.name}
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
                          <PsalmlogCTA variant="inline" campaign="program_page" />
                        )}
                      </Fragment>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {showPagination && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      {currentPage > 1 ? (
                        <Link
                          href={`/churches/programs/${slug}${currentPage === 2 ? '' : `?page=${currentPage - 1}`}`}
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
                              href={`/churches/programs/${slug}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
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
                          href={`/churches/programs/${slug}?page=${currentPage + 1}`}
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
                  <Users className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                  <p className="text-lg font-medium text-[var(--foreground)] mb-2">
                    No churches found
                  </p>
                  <p className="text-[var(--muted)] max-w-md mx-auto">
                    We&apos;re still building our database of churches with {programData.name.toLowerCase()}.
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
              <PsalmlogCTA variant="sidebar" campaign="program_page" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="program_page" />
        </div>
      </div>
    </>
  );
}

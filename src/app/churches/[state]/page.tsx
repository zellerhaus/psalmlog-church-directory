import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import SearchBox from '@/components/SearchBox';
import FAQSection from '@/components/FAQSection';
import LocationStats from '@/components/LocationStats';
import { getChurchCountByState, getCitiesWithChurchCounts, getStateContent } from '@/lib/data';
import { US_STATES, SITE_NAME } from '@/lib/constants';

interface StatePageProps {
  params: Promise<{ state: string }>;
}

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

  return {
    title: `Churches in ${stateInfo.name} | ${SITE_NAME}`,
    description: `Find churches in ${stateInfo.name}. Browse by city, denomination, and worship style.`,
    openGraph: {
      title: `Churches in ${stateInfo.name} | ${SITE_NAME}`,
      description: `Find churches in ${stateInfo.name}. Browse by city, denomination, and worship style.`,
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state: stateSlug } = await params;

  // Find state info from constants
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);

  if (!stateInfo) {
    notFound();
  }

  // Get real church counts from the churches table
  let totalChurches = 0;
  let cities: { slug: string; name: string; church_count: number }[] = [];

  try {
    // Get total church count for the state
    totalChurches = await getChurchCountByState(stateInfo.abbr);

    // Get cities with real church counts (aggregated from churches)
    cities = await getCitiesWithChurchCounts(stateInfo.abbr);
  } catch {
    // Database not connected, use empty state
  }

  // Get pre-generated content for this state
  const content = await getStateContent(stateInfo.abbr);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: stateInfo.name }]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4 font-serif">
          Churches in {stateInfo.name}
        </h1>

        {/* AI-generated overview or fallback */}
        {content?.overview ? (
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-lg text-[var(--muted)] leading-relaxed">
              {content.overview}
            </p>
          </div>
        ) : (
          <p className="text-lg text-[var(--muted)] mb-6">
            {totalChurches > 0
              ? `Find ${totalChurches.toLocaleString()} churches across ${cities.length} cities in ${stateInfo.name}.`
              : `Browse churches across ${stateInfo.name}.`}
          </p>
        )}

        <SearchBox
          placeholder={`Search churches in ${stateInfo.name}...`}
          className="max-w-xl"
        />
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
              <h2 className="text-xl font-semibold mb-4">Cities in {stateInfo.name}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cities.map((city) => (
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
            </>
          ) : (
            <div className="text-center py-12 bg-[var(--secondary)] rounded-lg">
              <MapPin className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No cities found yet
              </h3>
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
  );
}

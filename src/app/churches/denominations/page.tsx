import { Metadata } from 'next';
import Link from 'next/link';
import { Church } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import { getDenominationStats } from '@/lib/data';
import {
  DENOMINATIONS,
  DENOMINATION_TO_SLUG,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants';

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Browse Churches by Denomination',
  description: 'Find churches by denomination across the United States. Browse Baptist, Catholic, Methodist, Lutheran, Presbyterian, and more.',
  alternates: {
    canonical: `${SITE_URL}/churches/denominations`,
  },
  openGraph: {
    title: 'Browse Churches by Denomination | Psalmlog Church Finder',
    description: 'Find churches by denomination across the United States. Browse Baptist, Catholic, Methodist, Lutheran, Presbyterian, and more.',
    url: `${SITE_URL}/churches/denominations`,
    type: 'website',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og/home`,
        width: 1200,
        height: 630,
        alt: 'Browse Churches by Denomination',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Churches by Denomination | Psalmlog Church Finder',
    description: 'Find churches by denomination across the United States.',
    images: [`${SITE_URL}/og/home`],
  },
};

// BreadcrumbList Schema
function BreadcrumbSchema() {
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function DenominationsPage() {
  // Get denomination stats (counts)
  let denominationStats: { denomination: string; count: number }[] = [];

  try {
    denominationStats = await getDenominationStats(50);
  } catch {
    // Database not connected, use empty counts
  }

  // Create a map for quick count lookup
  const countMap = new Map(denominationStats.map((d) => [d.denomination, d.count]));

  // Build denomination list with counts, sorted by count
  const denominations = DENOMINATIONS
    .filter((d) => d !== 'Other') // Exclude "Other" for cleaner listing
    .map((name) => ({
      name,
      slug: DENOMINATION_TO_SLUG[name] || name.toLowerCase().replace(/\s+/g, '-'),
      count: countMap.get(name) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalChurches = denominationStats.reduce((sum, d) => sum + d.count, 0);

  return (
    <>
      <BreadcrumbSchema />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Denominations' }]} />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              Browse Churches by Denomination
            </h1>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Explore ${totalChurches.toLocaleString()} churches across ${denominations.length} denominations. Find a faith community that aligns with your beliefs and worship style.`
                : `Explore churches across ${denominations.length} denominations. Find a faith community that aligns with your beliefs.`}
            </p>

            <SearchBox
              placeholder="Search churches by name or location..."
              className="max-w-xl shadow-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Denominations Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {denominations.map((denomination) => (
                <Link
                  key={denomination.slug}
                  href={`/churches/denominations/${denomination.slug}`}
                  className="card p-5 hover:border-[var(--primary)] group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[var(--secondary)] rounded-lg flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                        <Church className="w-6 h-6 text-[var(--primary)]" />
                      </div>
                    </div>
                    <div>
                      <h2 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                        {denomination.name}
                      </h2>
                      {denomination.count > 0 && (
                        <p className="text-sm text-[var(--muted)]">
                          {denomination.count.toLocaleString()} church{denomination.count !== 1 ? 'es' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* About Denominations Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                Understanding Church Denominations
              </h2>
              <div className="prose max-w-none text-[var(--muted)]">
                <p className="mb-4 leading-relaxed">
                  Christian denominations represent different traditions and expressions of faith within Christianity.
                  While all share core beliefs about Jesus Christ, each denomination has its own history, worship style,
                  and theological emphases.
                </p>
                <p className="mb-4 leading-relaxed">
                  Whether you prefer the liturgical traditions of Catholic or Episcopal churches, the evangelical fervor
                  of Baptist or Pentecostal congregations, or the community focus of non-denominational fellowships,
                  you&apos;ll find churches that welcome visitors and newcomers.
                </p>
                <p className="leading-relaxed">
                  Use our directory to explore churches by denomination and find a faith community where you feel at home.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 self-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <FirstVisitGuideCTA variant="sidebar" />
              <PsalmlogCTA variant="sidebar" campaign="denominations_index" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="denominations_index" />
        </div>
      </div>
    </>
  );
}

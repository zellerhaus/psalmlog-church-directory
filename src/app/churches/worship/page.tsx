import { Metadata } from 'next';
import Link from 'next/link';
import { Music } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import { getChurchCountByWorshipStyle } from '@/lib/data';
import {
  WORSHIP_STYLES,
  WORSHIP_STYLE_TO_SLUG,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants';

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Worship style descriptions
const WORSHIP_STYLE_INFO: Record<string, { description: string; icon: string }> = {
  'Contemporary': {
    description: 'Modern worship music, casual atmosphere, multimedia presentations',
    icon: '🎸',
  },
  'Traditional': {
    description: 'Classic hymns, formal liturgy, organ and choir music',
    icon: '🎹',
  },
  'Blended': {
    description: 'Mix of contemporary and traditional worship elements',
    icon: '🎵',
  },
  'Liturgical': {
    description: 'Structured services with creeds, responsive readings, sacraments',
    icon: '📖',
  },
  'Gospel': {
    description: 'Energetic, choir-driven worship with expressive celebration',
    icon: '🎤',
  },
  'Charismatic': {
    description: 'Spirit-led worship emphasizing spiritual gifts and praise',
    icon: '✨',
  },
};

export const metadata: Metadata = {
  title: 'Browse Churches by Worship Style',
  description: 'Find churches by worship style across the United States. Browse Contemporary, Traditional, Blended, Liturgical, Gospel, and Charismatic worship services.',
  alternates: {
    canonical: `${SITE_URL}/churches/worship`,
  },
  openGraph: {
    title: 'Browse Churches by Worship Style | Psalmlog Church Finder',
    description: 'Find churches by worship style across the United States. Browse Contemporary, Traditional, Blended, Liturgical, Gospel, and Charismatic worship.',
    url: `${SITE_URL}/churches/worship`,
    type: 'website',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og/home`,
        width: 1200,
        height: 630,
        alt: 'Browse Churches by Worship Style',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Churches by Worship Style | Psalmlog Church Finder',
    description: 'Find churches by worship style across the United States.',
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
        name: 'Worship Styles',
        item: `${SITE_URL}/churches/worship`,
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

export default async function WorshipStylesPage() {
  // Get counts for each worship style
  const styleCounts = await Promise.all(
    WORSHIP_STYLES.map(async (style) => {
      try {
        const count = await getChurchCountByWorshipStyle(style);
        return { style, count };
      } catch {
        return { style, count: 0 };
      }
    })
  );

  // Build worship style list with counts
  const worshipStyles = WORSHIP_STYLES.map((name) => {
    const countData = styleCounts.find((s) => s.style === name);
    return {
      name,
      slug: WORSHIP_STYLE_TO_SLUG[name] || name.toLowerCase(),
      count: countData?.count || 0,
      info: WORSHIP_STYLE_INFO[name],
    };
  }).sort((a, b) => b.count - a.count);

  const totalChurches = styleCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <BreadcrumbSchema />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Worship Styles' }]} />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              Browse Churches by Worship Style
            </h1>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Explore ${totalChurches.toLocaleString()} churches across ${worshipStyles.length} worship styles. Find a service format that resonates with your spiritual journey.`
                : `Explore churches across ${worshipStyles.length} worship styles. Find a service format that resonates with you.`}
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
            {/* Worship Styles Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {worshipStyles.map((style) => (
                <Link
                  key={style.slug}
                  href={`/churches/worship/${style.slug}`}
                  className="card p-6 hover:border-[var(--primary)] group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-[var(--secondary)] rounded-lg flex items-center justify-center text-2xl group-hover:bg-[var(--primary)]/10 transition-colors">
                        {style.info?.icon || <Music className="w-7 h-7 text-[var(--primary)]" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-1">
                        {style.name}
                      </h2>
                      {style.info?.description && (
                        <p className="text-sm text-[var(--muted)] mb-2">
                          {style.info.description}
                        </p>
                      )}
                      {style.count > 0 && (
                        <p className="text-sm font-medium text-[var(--primary)]">
                          {style.count.toLocaleString()} church{style.count !== 1 ? 'es' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* About Worship Styles Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                Choosing the Right Worship Style
              </h2>
              <div className="prose max-w-none text-[var(--muted)]">
                <p className="mb-4 leading-relaxed">
                  Worship style is one of the most personal aspects of choosing a church home.
                  The way a congregation worships reflects its theology, culture, and community values.
                  There&apos;s no right or wrong choice—what matters is finding a style that helps you
                  connect with God and fellow believers.
                </p>
                <p className="mb-4 leading-relaxed">
                  <strong>Contemporary worship</strong> tends to feature modern music with full bands,
                  casual dress, and engaging multimedia. <strong>Traditional worship</strong> honors
                  centuries-old practices with hymns, choirs, and formal liturgy. <strong>Blended services</strong>
                  combine elements of both for multigenerational appeal.
                </p>
                <p className="leading-relaxed">
                  <strong>Liturgical churches</strong> follow structured orders of service with responsive
                  readings and sacraments. <strong>Gospel worship</strong> is known for energetic,
                  choir-driven celebration. <strong>Charismatic services</strong> emphasize the Holy Spirit
                  and expressive praise.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 self-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <FirstVisitGuideCTA variant="sidebar" />
              <PsalmlogCTA variant="sidebar" campaign="worship_index" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="worship_index" />
        </div>
      </div>
    </>
  );
}

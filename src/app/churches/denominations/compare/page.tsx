import { Metadata } from 'next';
import Link from 'next/link';
import { Church, ArrowRight, BarChart3 } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ComparisonSelector from '@/components/ComparisonSelector';
import ShareButtons from '@/components/ShareButtons';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import {
  getChurchCountByDenomination,
  getDenominationWorshipStyles,
  getDenominationStatsByState,
} from '@/lib/data';
import {
  DENOMINATION_SLUGS,
  DENOMINATION_TO_SLUG,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants';
import {
  DENOMINATION_PROFILES,
  COMPARISON_CATEGORIES,
  getDenominationProfile,
} from '@/lib/denomination-data';

export const revalidate = 86400; // 24 hours

interface ComparePageProps {
  searchParams: Promise<{ d1?: string; d2?: string }>;
}

// Build the sorted denominations list for the selector
const denominationsList = Object.entries(DENOMINATION_SLUGS)
  .filter(([slug]) => slug !== 'other')
  .filter(([slug]) => DENOMINATION_PROFILES[slug])
  .map(([slug, name]) => ({ slug, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Popular comparisons for the landing state
const POPULAR_COMPARISONS = [
  { d1: 'baptist', d2: 'methodist' },
  { d1: 'catholic', d2: 'lutheran' },
  { d1: 'presbyterian', d2: 'reformed' },
  { d1: 'pentecostal', d2: 'charismatic' },
  { d1: 'episcopal', d2: 'catholic' },
  { d1: 'non-denominational', d2: 'baptist' },
  { d1: 'methodist', d2: 'presbyterian' },
  { d1: 'lutheran', d2: 'episcopal' },
  { d1: 'southern-baptist', d2: 'baptist' },
  { d1: 'assemblies-of-god', d2: 'pentecostal' },
  { d1: 'catholic', d2: 'orthodox' },
  { d1: 'nazarene', d2: 'methodist' },
];

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const { d1, d2 } = await searchParams;

  const left = d1 ? getDenominationProfile(d1) : null;
  const right = d2 ? getDenominationProfile(d2) : null;

  if (left && right) {
    const title = `${left.name} vs ${right.name}: What's the Difference?`;
    const description = `Compare ${left.name} and ${right.name} churches side by side. See differences in beliefs, worship style, governance, sacraments, and find churches near you.`;
    const canonicalUrl = `${SITE_URL}/churches/denominations/compare?d1=${d1}&d2=${d2}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        url: canonicalUrl,
        type: 'website',
        siteName: SITE_NAME,
        images: [{ url: `${SITE_URL}/og/home`, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ${SITE_NAME}`,
        description,
        images: [`${SITE_URL}/og/home`],
      },
    };
  }

  const title = 'Compare Church Denominations Side by Side';
  const description =
    'Compare any two Christian denominations side by side. See differences in beliefs, worship style, governance, sacraments, and find churches near you.';
  const canonicalUrl = `${SITE_URL}/churches/denominations/compare`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: `${SITE_URL}/og/home`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og/home`],
    },
  };
}

// BreadcrumbList Schema
function BreadcrumbSchema({
  leftName,
  rightName,
  d1,
  d2,
}: {
  leftName?: string;
  rightName?: string;
  d1?: string;
  d2?: string;
}) {
  const items = [
    { position: 1, name: 'Churches', item: `${SITE_URL}/churches` },
    { position: 2, name: 'Denominations', item: `${SITE_URL}/churches/denominations` },
    {
      position: 3,
      name: leftName && rightName ? `${leftName} vs ${rightName}` : 'Compare',
      item:
        d1 && d2
          ? `${SITE_URL}/churches/denominations/compare?d1=${d1}&d2=${d2}`
          : `${SITE_URL}/churches/denominations/compare`,
    },
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      ...item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ Schema for comparison pages
function ComparisonFAQSchema({ leftName, rightName }: { leftName: string; rightName: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the main difference between ${leftName} and ${rightName} churches?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${leftName} and ${rightName} churches differ in their governance structure, worship practices, theological emphases, and views on sacraments. Use our comparison tool to see a detailed side-by-side breakdown of these differences.`,
        },
      },
      {
        '@type': 'Question',
        name: `Can I switch from a ${leftName} church to a ${rightName} church?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, you can attend and join any church you choose. While each denomination has its own membership process, all Christian churches welcome visitors. We recommend visiting a few times and speaking with the pastor to learn about their specific community.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which is bigger, ${leftName} or ${rightName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Church counts vary by region. Use our directory to see how many ${leftName} and ${rightName} churches are in your area, or browse our denomination pages for national statistics.`,
        },
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

// WebApplication schema
function WebAppSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Denomination Comparison Tool',
    description:
      'Compare Christian denominations side by side. See differences in beliefs, worship style, governance, and sacraments.',
    url: `${SITE_URL}/churches/denominations/compare`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'Organization', name: 'Psalmlog', url: SITE_URL },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function CompareDenominationsPage({ searchParams }: ComparePageProps) {
  const { d1, d2 } = await searchParams;

  const leftProfile = d1 ? getDenominationProfile(d1) : null;
  const rightProfile = d2 ? getDenominationProfile(d2) : null;
  const hasComparison = leftProfile && rightProfile;

  // Fetch dynamic stats if we have a comparison
  let leftCount = 0;
  let rightCount = 0;
  let leftStyles: { style: string; count: number }[] = [];
  let rightStyles: { style: string; count: number }[] = [];
  let leftTopStates: { state_abbr: string; state: string; count: number }[] = [];
  let rightTopStates: { state_abbr: string; state: string; count: number }[] = [];

  if (hasComparison) {
    try {
      [leftCount, rightCount, leftStyles, rightStyles, leftTopStates, rightTopStates] =
        await Promise.all([
          getChurchCountByDenomination(leftProfile.name),
          getChurchCountByDenomination(rightProfile.name),
          getDenominationWorshipStyles(leftProfile.name),
          getDenominationWorshipStyles(rightProfile.name),
          getDenominationStatsByState(leftProfile.name),
          getDenominationStatsByState(rightProfile.name),
        ]);
    } catch {
      // Database not connected
    }
  }

  return (
    <>
      <BreadcrumbSchema
        leftName={leftProfile?.name}
        rightName={rightProfile?.name}
        d1={d1}
        d2={d2}
      />
      <WebAppSchema />
      {hasComparison && (
        <ComparisonFAQSchema leftName={leftProfile.name} rightName={rightProfile.name} />
      )}

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Denominations', href: '/churches/denominations' },
            {
              label: hasComparison
                ? `${leftProfile.name} vs ${rightProfile.name}`
                : 'Compare',
            },
          ]}
        />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <p className="section-label text-gray-300 mb-3">Denomination Comparison Tool</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              {hasComparison
                ? `${leftProfile.name} vs ${rightProfile.name}`
                : 'Compare Church Denominations'}
            </h1>
            <p className="text-lg text-gray-100 mb-6">
              {hasComparison
                ? `See how ${leftProfile.name} and ${rightProfile.name} churches differ in beliefs, worship, governance, and practice.`
                : 'Select two denominations to see a detailed side-by-side comparison of beliefs, worship style, governance, and more.'}
            </p>
          </div>
        </div>

        {/* Selector */}
        <div className="card p-6 mb-8">
          <ComparisonSelector
            denominations={denominationsList}
            selectedLeft={d1 && leftProfile ? d1 : undefined}
            selectedRight={d2 && rightProfile ? d2 : undefined}
          />
        </div>

        {hasComparison ? (
          /* ===== COMPARISON VIEW ===== */
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Share buttons */}
              <div className="flex justify-end mb-6">
                <ShareButtons
                  url={`${SITE_URL}/churches/denominations/compare?d1=${d1}&d2=${d2}`}
                  title={`${leftProfile.name} vs ${rightProfile.name}: What's the Difference?`}
                  text={`Comparing ${leftProfile.name} and ${rightProfile.name} churches \u2014 check out the differences in beliefs, worship style, and more:`}
                />
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Church className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {leftProfile.name}
                      </h3>
                      {leftCount > 0 && (
                        <p className="text-sm text-[var(--primary)]">
                          {leftCount.toLocaleString()} churches in directory
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{leftProfile.governance} governance</p>
                  {leftTopStates.length > 0 && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      Most churches in {leftTopStates[0].state}
                    </p>
                  )}
                </div>
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
                      <Church className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {rightProfile.name}
                      </h3>
                      {rightCount > 0 && (
                        <p className="text-sm text-[var(--primary)]">
                          {rightCount.toLocaleString()} churches in directory
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {rightProfile.governance} governance
                  </p>
                  {rightTopStates.length > 0 && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      Most churches in {rightTopStates[0].state}
                    </p>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="space-y-6">
                {COMPARISON_CATEGORIES.map((category) => (
                  <ComparisonRow
                    key={category.key}
                    label={category.label}
                    categoryKey={category.key}
                    left={leftProfile}
                    right={rightProfile}
                  />
                ))}
              </div>

              {/* Worship Style Distribution */}
              {(leftStyles.length > 0 || rightStyles.length > 0) && (
                <section className="mt-10">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                    Worship Style Distribution
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <WorshipStyleBreakdown
                      name={leftProfile.name}
                      styles={leftStyles}
                      total={leftCount}
                    />
                    <WorshipStyleBreakdown
                      name={rightProfile.name}
                      styles={rightStyles}
                      total={rightCount}
                    />
                  </div>
                </section>
              )}

              {/* Find Churches CTAs */}
              <section className="mt-10 grid sm:grid-cols-2 gap-4">
                <Link
                  href={`/churches/denominations/${d1}`}
                  className="card p-5 hover:border-[var(--primary)] group"
                >
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-1">
                    Find {leftProfile.name} Churches
                  </h3>
                  <p className="text-sm text-[var(--muted)] mb-3">
                    Browse {leftCount > 0 ? `${leftCount.toLocaleString()} ` : ''}
                    {leftProfile.name} churches across the United States.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                    Browse churches <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link
                  href={`/churches/denominations/${d2}`}
                  className="card p-5 hover:border-[var(--primary)] group"
                >
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-1">
                    Find {rightProfile.name} Churches
                  </h3>
                  <p className="text-sm text-[var(--muted)] mb-3">
                    Browse {rightCount > 0 ? `${rightCount.toLocaleString()} ` : ''}
                    {rightProfile.name} churches across the United States.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                    Browse churches <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </section>

              {/* SEO Content */}
              <section className="mt-12 prose max-w-none">
                <h2>
                  Understanding the Difference Between {leftProfile.name} and {rightProfile.name}{' '}
                  Churches
                </h2>
                <p>
                  Both {leftProfile.name} and {rightProfile.name} churches are part of the broader
                  Christian tradition, but they have distinct approaches to worship, theology, and
                  church life. Understanding these differences can help you find a church community
                  that aligns with your beliefs and preferences.
                </p>

                <h3>Governance and Structure</h3>
                <p>
                  {leftProfile.name} churches use a{' '}
                  <strong>{leftProfile.governance.toLowerCase()}</strong> form of governance:{' '}
                  {leftProfile.governanceDescription} In contrast, {rightProfile.name} churches
                  follow a <strong>{rightProfile.governance.toLowerCase()}</strong> model:{' '}
                  {rightProfile.governanceDescription}
                </p>

                <h3>Worship and Practice</h3>
                <p>
                  {leftProfile.worshipDescription} By comparison, {rightProfile.worshipDescription.charAt(0).toLowerCase() + rightProfile.worshipDescription.slice(1)}
                </p>

                <h3>Finding the Right Church for You</h3>
                <p>
                  Whether you&apos;re drawn to {leftProfile.name} or {rightProfile.name} churches,
                  the most important step is to visit. Each congregation has its own personality
                  beyond its denominational identity. Use our directory to find{' '}
                  <Link href={`/churches/denominations/${d1}`}>{leftProfile.name} churches</Link>{' '}
                  or{' '}
                  <Link href={`/churches/denominations/${d2}`}>{rightProfile.name} churches</Link>{' '}
                  near you, and consider taking our{' '}
                  <Link href="/churches/quiz">church finder quiz</Link> for personalized
                  recommendations.
                </p>
              </section>

              {/* Other Comparisons */}
              <section className="mt-12">
                <h2 className="text-xl font-semibold mb-4">Other Comparisons</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {POPULAR_COMPARISONS.filter(
                    (c) => !(c.d1 === d1 && c.d2 === d2) && !(c.d1 === d2 && c.d2 === d1)
                  )
                    .slice(0, 6)
                    .map((comp) => {
                      const compLeft = DENOMINATION_SLUGS[comp.d1];
                      const compRight = DENOMINATION_SLUGS[comp.d2];
                      if (!compLeft || !compRight) return null;
                      return (
                        <Link
                          key={`${comp.d1}-${comp.d2}`}
                          href={`/churches/denominations/compare?d1=${comp.d1}&d2=${comp.d2}`}
                          className="card p-4 hover:border-[var(--primary)] text-sm group"
                        >
                          <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            {compLeft} vs {compRight}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 self-start">
              <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                <FirstVisitGuideCTA variant="sidebar" />
                <PsalmlogCTA variant="sidebar" campaign="denomination_compare" />
              </div>
            </div>
          </div>
        ) : (
          /* ===== LANDING STATE (no comparison selected) ===== */
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Popular Comparisons Grid */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Popular Comparisons</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {POPULAR_COMPARISONS.map((comp) => {
                    const compLeft = DENOMINATION_SLUGS[comp.d1];
                    const compRight = DENOMINATION_SLUGS[comp.d2];
                    if (!compLeft || !compRight) return null;
                    return (
                      <Link
                        key={`${comp.d1}-${comp.d2}`}
                        href={`/churches/denominations/compare?d1=${comp.d1}&d2=${comp.d2}`}
                        className="card p-5 hover:border-[var(--primary)] group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Church className="w-4 h-4 text-[var(--primary)]" />
                          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                            Compare
                          </span>
                        </div>
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                          {compLeft} vs {compRight}
                        </h3>
                        <p className="text-sm text-[var(--muted)] mt-1">
                          See the key differences
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Educational Content */}
              <section className="mt-12 prose max-w-none">
                <h2>Why Compare Church Denominations?</h2>
                <p>
                  With hundreds of Christian denominations worldwide, understanding the
                  differences between traditions can feel overwhelming. Our denomination
                  comparison tool makes it simple to see how any two traditions differ in their
                  core beliefs, worship style, church governance, and sacramental practices.
                </p>

                <h3>What You&apos;ll Learn</h3>
                <ul>
                  <li>
                    <strong>Key beliefs</strong> &mdash; Theological distinctives that define each
                    tradition
                  </li>
                  <li>
                    <strong>Worship style</strong> &mdash; What to expect on a Sunday morning
                  </li>
                  <li>
                    <strong>Governance</strong> &mdash; How churches are organized and led
                  </li>
                  <li>
                    <strong>Sacraments</strong> &mdash; Views on baptism, communion, and other
                    practices
                  </li>
                  <li>
                    <strong>Church counts</strong> &mdash; Real data from our directory of 100,000+
                    churches
                  </li>
                </ul>

                <h3>How to Use This Tool</h3>
                <p>
                  Select any two denominations from the dropdown menus above to see a detailed
                  side-by-side comparison. You can also click on any of the popular comparisons
                  below to get started. Once you&apos;ve found a denomination that interests you,
                  use our <Link href="/churches">church directory</Link> to find specific
                  congregations near you.
                </p>

                <h3>Common Questions About Denominations</h3>
                <p>
                  Many people wonder about the difference between seemingly similar traditions.
                  For example, what distinguishes Baptist from Southern Baptist? How are
                  Pentecostal and Charismatic churches different? Is there a meaningful difference
                  between Methodist and United Methodist? Our comparison tool addresses these
                  questions with clear, factual information drawn from each tradition&apos;s own
                  teachings and practices.
                </p>

                <p>
                  Not sure which denomination to explore? Take our{' '}
                  <Link href="/churches/quiz">church finder quiz</Link> to discover which type
                  of church matches your worship preferences and spiritual priorities.
                </p>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 self-start">
              <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                <FirstVisitGuideCTA variant="sidebar" />
                <PsalmlogCTA variant="sidebar" campaign="denomination_compare" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="denomination_compare" />
        </div>
      </div>
    </>
  );
}

// ========== Helper Components ==========

function ComparisonRow({
  label,
  categoryKey,
  left,
  right,
}: {
  label: string;
  categoryKey: string;
  left: NonNullable<ReturnType<typeof getDenominationProfile>>;
  right: NonNullable<ReturnType<typeof getDenominationProfile>>;
}) {
  const leftValue = getComparisonValue(left, categoryKey);
  const rightValue = getComparisonValue(right, categoryKey);

  return (
    <div className="card overflow-hidden">
      <div className="bg-[var(--secondary)] px-5 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)]">{label}</h3>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mb-2">
            {left.name}
          </p>
          <ComparisonContent value={leftValue} />
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wide mb-2">
            {right.name}
          </p>
          <ComparisonContent value={rightValue} />
        </div>
      </div>
    </div>
  );
}

function ComparisonContent({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1.5">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted)]">
            <span className="text-[var(--primary)] mt-1 flex-shrink-0">&bull;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm text-[var(--muted)] leading-relaxed">{value}</p>;
}

function getComparisonValue(
  profile: NonNullable<ReturnType<typeof getDenominationProfile>>,
  key: string
): string | string[] {
  switch (key) {
    case 'overview':
      return profile.overview;
    case 'founded':
      return profile.founded;
    case 'governance':
      return profile.governanceDescription;
    case 'beliefs':
      return profile.beliefs;
    case 'worshipDescription':
      return profile.worshipDescription;
    case 'sacraments':
      return profile.sacraments;
    case 'baptism':
      return profile.baptism;
    case 'communion':
      return profile.communion;
    case 'distinctives':
      return profile.distinctives;
    default:
      return '';
  }
}

function WorshipStyleBreakdown({
  name,
  styles,
  total,
}: {
  name: string;
  styles: { style: string; count: number }[];
  total: number;
}) {
  if (styles.length === 0) return null;

  const maxCount = styles[0]?.count || 1;

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3">{name}</h3>
      <div className="space-y-2.5">
        {styles.slice(0, 5).map((item) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));
          return (
            <div key={item.style}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--foreground)] font-medium">{item.style}</span>
                <span className="text-[var(--muted)]">
                  {item.count.toLocaleString()} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

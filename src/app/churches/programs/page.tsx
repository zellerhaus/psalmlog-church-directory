import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Baby, Heart } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import FirstVisitGuideCTA from '@/components/FirstVisitGuideCTA';
import SearchBox from '@/components/SearchBox';
import { getChurchCountByProgram } from '@/lib/data';
import {
  CHURCH_PROGRAMS,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants';

// Revalidate the page every 24 hours (ISR)
export const revalidate = 86400;

// Program display info
const PROGRAM_DISPLAY: Record<string, { description: string; icon: React.ReactNode; color: string }> = {
  'kids-ministry': {
    description: 'Churches with dedicated children\'s programming including nursery care, Sunday school, and age-appropriate activities during services.',
    icon: <Baby className="w-8 h-8" />,
    color: 'text-emerald-600 bg-emerald-50',
  },
  'youth-group': {
    description: 'Churches offering programs for middle and high school students including Bible study, fellowship, service projects, and retreats.',
    icon: <Users className="w-8 h-8" />,
    color: 'text-blue-600 bg-blue-50',
  },
  'small-groups': {
    description: 'Churches with home groups, life groups, or cell groups for Bible study, prayer, and building deeper community connections.',
    icon: <Heart className="w-8 h-8" />,
    color: 'text-purple-600 bg-purple-50',
  },
};

export const metadata: Metadata = {
  title: 'Browse Churches by Program & Ministry',
  description: 'Find churches with kids ministry, youth groups, and small groups across the United States. Family-focused programs to help you connect.',
  alternates: {
    canonical: `${SITE_URL}/churches/programs`,
  },
  openGraph: {
    title: 'Browse Churches by Program & Ministry | Psalmlog Church Finder',
    description: 'Find churches with kids ministry, youth groups, and small groups across the United States.',
    url: `${SITE_URL}/churches/programs`,
    type: 'website',
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og/home`,
        width: 1200,
        height: 630,
        alt: 'Browse Churches by Program',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Churches by Program & Ministry | Psalmlog Church Finder',
    description: 'Find churches with family programs across the United States.',
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
        name: 'Programs',
        item: `${SITE_URL}/churches/programs`,
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

export default async function ProgramsPage() {
  // Get counts for each program
  const programCounts = await Promise.all(
    CHURCH_PROGRAMS.map(async (program) => {
      try {
        const count = await getChurchCountByProgram(program.field);
        return { ...program, count };
      } catch {
        return { ...program, count: 0 };
      }
    })
  );

  const totalChurches = programCounts.reduce((sum, p) => sum + p.count, 0);

  return (
    <>
      <BreadcrumbSchema />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Programs' }]} />

        {/* Header */}
        <div className="relative mb-8 -mx-4 md:-mx-8 px-4 md:px-8 py-12 md:py-16 bg-[var(--primary)] text-white overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/90 to-[var(--primary)]/70" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif text-white">
              Browse Churches by Program
            </h1>

            <p className="text-lg text-gray-100 mb-6">
              {totalChurches > 0
                ? `Find churches with the programs that matter to your family. Browse ${totalChurches.toLocaleString()} churches with specialized ministries for kids, teens, and adults.`
                : 'Find churches with the programs that matter to your family. Browse by kids ministry, youth groups, and small groups.'}
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
            {/* Programs Grid */}
            <div className="space-y-6">
              {programCounts.map((program) => {
                const display = PROGRAM_DISPLAY[program.slug];
                return (
                  <Link
                    key={program.slug}
                    href={`/churches/programs/${program.slug}`}
                    className="card p-6 hover:border-[var(--primary)] group block"
                  >
                    <div className="flex items-start gap-5">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${display?.color || 'text-[var(--primary)] bg-[var(--secondary)]'}`}>
                        {display?.icon || <Users className="w-8 h-8" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h2 className="text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors font-serif">
                            {program.name}
                          </h2>
                          {program.count > 0 && (
                            <span className="text-sm font-medium text-[var(--primary)] bg-[var(--secondary)] px-3 py-1 rounded-full">
                              {program.count.toLocaleString()} churches
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--muted)] leading-relaxed">
                          {display?.description || `Churches offering ${program.name.toLowerCase()} programs.`}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* About Programs Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-4 font-serif text-[var(--foreground)]">
                Finding the Right Programs for Your Family
              </h2>
              <div className="prose max-w-none text-[var(--muted)]">
                <p className="mb-4 leading-relaxed">
                  Church programs can make all the difference in helping your family grow spiritually and connect
                  with a faith community. Whether you have young children, teenagers, or are looking for adult
                  fellowship opportunities, the right programs can enhance your church experience.
                </p>
                <p className="mb-4 leading-relaxed">
                  <strong>Kids Ministry</strong> programs provide safe, engaging environments where children can
                  learn about faith at their level. Look for churches with trained volunteers, secure check-in
                  systems, and age-appropriate curriculum.
                </p>
                <p className="mb-4 leading-relaxed">
                  <strong>Youth Groups</strong> help teenagers navigate the challenges of adolescence with spiritual
                  guidance and peer support. Strong youth programs combine Bible study with fun activities,
                  service opportunities, and mentorship.
                </p>
                <p className="leading-relaxed">
                  <strong>Small Groups</strong> offer intimate settings for building deeper relationships, studying
                  Scripture together, and supporting one another through life&apos;s ups and downs. They&apos;re an
                  excellent way to move beyond Sunday attendance into genuine community.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 self-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <FirstVisitGuideCTA variant="sidebar" />
              <PsalmlogCTA variant="sidebar" campaign="programs_index" />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="inline" campaign="programs_index" />
        </div>
      </div>
    </>
  );
}

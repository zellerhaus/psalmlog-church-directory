import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Users,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import ChurchClientSection from '@/components/ChurchClientSection';
import RelatedChurches from '@/components/RelatedChurches';
import NearbyChurches from '@/components/NearbyChurches';
import ChurchQuickActions from '@/components/ChurchQuickActions';
import FavoriteButton from '@/components/FavoriteButton';
import { US_STATES, SITE_URL, hasEnoughContent, addChurchUtmParams, DENOMINATION_TO_SLUG, WORSHIP_STYLE_TO_SLUG } from '@/lib/constants';
import { getChurchBySlug, getRelatedChurches, getNearbyChurches } from '@/lib/data';
import type { Church, ServiceTime } from '@/types/database';

interface PageProps {
  params: Promise<{ state: string; city: string; church: string }>;
}

// Revalidate church pages every 24 hours (ISR)
export const revalidate = 86400;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, church: churchSlug } = await params;

  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    return {
      title: 'Church Not Found',
      description: 'The requested church could not be found.',
    };
  }

  const church = await getChurchBySlug(stateInfo.abbr, citySlug, churchSlug);

  if (!church) {
    return {
      title: 'Church Not Found',
      description: 'The requested church could not be found.',
    };
  }

  const title = `${church.name} in ${church.city}, ${church.state_abbr}`;
  const description = church.ai_description
    ? church.ai_description.slice(0, 152) + '...'
    : `Service times, location, and visitor info for ${church.name} in ${church.city}, ${stateInfo.abbr}.`;

  const canonicalUrl = `https://psalmlog.com/churches/${stateSlug}/${citySlug}/${churchSlug}`;

  // Check if page has enough unique content for indexing
  const shouldIndex = hasEnoughContent(church.ai_description, church.ai_what_to_expect);

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
      siteName: 'Psalmlog Church Finder',
      images: [
        {
          url: `${SITE_URL}/og/church/${stateSlug}/${citySlug}/${churchSlug}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og/church/${stateSlug}/${citySlug}/${churchSlug}`],
    },
  };
}

// Schema.org markup component
function ChurchSchema({ church, stateInfo }: { church: Church; stateInfo: typeof US_STATES[number] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: church.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: church.address,
      addressLocality: church.city,
      addressRegion: church.state_abbr,
      postalCode: church.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: church.lat,
      longitude: church.lng,
    },
    ...(church.phone && { telephone: church.phone }),
    ...(church.website && { url: church.website }),
    ...(church.denomination && { additionalType: church.denomination }),
    ...(church.ai_description && { description: church.ai_description }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb Schema
function BreadcrumbSchema({ stateInfo, cityName, churchName, stateSlug, citySlug }: {
  stateInfo: typeof US_STATES[number];
  cityName: string;
  churchName: string;
  stateSlug: string;
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
        item: 'https://psalmlog.com/churches',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: stateInfo.name,
        item: `https://psalmlog.com/churches/${stateSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `https://psalmlog.com/churches/${stateSlug}/${citySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: churchName,
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

export default async function ChurchDetailPage({ params }: PageProps) {
  const { state: stateSlug, city: citySlug, church: churchSlug } = await params;

  // Find state info
  const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
  if (!stateInfo) {
    notFound();
  }

  // Format city name from slug
  const cityName = citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch church data
  const church = await getChurchBySlug(stateInfo.abbr, citySlug, churchSlug);

  if (!church) {
    notFound();
  }

  // Fetch related churches for internal linking (same city/state)
  const relatedChurches = await getRelatedChurches(stateInfo.abbr, church.city, church.id, 4);

  // Fetch nearby churches by geographic proximity (PostGIS)
  let nearbyChurches: Church[] = [];
  if (church.lat && church.lng) {
    nearbyChurches = await getNearbyChurches(church.lat, church.lng, 10, 5);
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${church.name} ${church.address} ${church.city} ${church.state_abbr}`
  )}`;

  return (
    <>
      <ChurchSchema church={church} stateInfo={stateInfo} />
      <BreadcrumbSchema
        stateInfo={stateInfo}
        cityName={cityName}
        churchName={church.name}
        stateSlug={stateSlug}
        citySlug={citySlug}
      />

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: stateInfo.name, href: `/churches/${stateSlug}` },
            { label: cityName, href: `/churches/${stateSlug}/${citySlug}` },
            { label: church.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {church.denomination && (
              <Link
                href={`/churches/denominations/${DENOMINATION_TO_SLUG[church.denomination] || church.denomination.toLowerCase().replace(/\s+/g, '-')}`}
                className="badge badge-primary hover:opacity-80 transition-opacity"
              >
                {church.denomination}
              </Link>
            )}
            {church.worship_style?.map((style) => (
              <Link
                key={style}
                href={`/churches/worship/${WORSHIP_STYLE_TO_SLUG[style] || style.toLowerCase().replace(/\s+/g, '-')}`}
                className="badge hover:opacity-80 transition-opacity"
              >
                {style}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-serif">
              {church.name}
            </h1>
            <FavoriteButton
              church={{
                id: church.id,
                slug: church.slug,
                name: church.name,
                city: church.city,
                stateAbbr: church.state_abbr,
                stateSlug: stateSlug,
                citySlug: citySlug,
                denomination: church.denomination,
                worshipStyle: church.worship_style,
                hasKidsMinistry: church.has_kids_ministry,
                hasYouthGroup: church.has_youth_group,
                hasSmallGroups: church.has_small_groups,
              }}
            />
          </div>
          <p className="text-lg text-[var(--muted)] flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {church.city}, {stateInfo.name}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8 min-w-0">
            {/* Contact & Location Card */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Contact & Location for {church.name}</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--muted)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[var(--foreground)]">{church.address}</p>
                    <p className="text-[var(--muted)]">
                      {church.city}, {church.state_abbr} {church.zip}
                    </p>
                  </div>
                </div>

                {church.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[var(--muted)]" />
                    <a
                      href={`tel:${church.phone}`}
                      className="text-[var(--primary)] hover:text-[var(--primary-hover)]"
                    >
                      {church.phone}
                    </a>
                  </div>
                )}

                {church.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[var(--muted)]" />
                    <a
                      href={addChurchUtmParams(church.website, 'contact_card')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </a>
                {church.website && (
                  <a
                    href={addChurchUtmParams(church.website, 'action_button')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Service Times */}
            {church.service_times && church.service_times.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--muted)]" />
                  Service Times for {church.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {church.service_times.map((service: ServiceTime, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {service.day} {service.time}
                        </p>
                        {service.name && (
                          <p className="text-sm text-[var(--muted)]">{service.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Programs */}
            {(church.has_kids_ministry ||
              church.has_youth_group ||
              church.has_small_groups) && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--muted)]" />
                    Programs & Ministries at {church.name}
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {church.has_kids_ministry && (
                      <Link
                        href="/churches/programs/kids-ministry"
                        className="p-4 bg-emerald-50 rounded-lg text-center hover:bg-emerald-100 transition-colors"
                      >
                        <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <p className="font-medium text-emerald-900">Kids Ministry</p>
                      </Link>
                    )}
                    {church.has_youth_group && (
                      <Link
                        href="/churches/programs/youth-group"
                        className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                      >
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-blue-900">Youth Group</p>
                      </Link>
                    )}
                    {church.has_small_groups && (
                      <Link
                        href="/churches/programs/small-groups"
                        className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                      >
                        <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="font-medium text-purple-900">Small Groups</p>
                      </Link>
                    )}
                  </div>
                </div>
              )}

            {/* About */}
            {church.ai_description && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">About {church.name}</h2>
                <p className="text-[var(--muted)] leading-relaxed">{church.ai_description}</p>
              </div>
            )}

            {/* What to Expect - Client Component for interactivity */}
            <ChurchClientSection
              whatToExpect={church.ai_what_to_expect}
              churchName={church.name}
            />

            {/* Disclaimer */}
            <p className="text-sm text-[var(--muted)] italic">
              Note: Church information may be outdated. Please verify details with the
              church directly before visiting.
            </p>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 min-w-0">
            <PsalmlogCTA variant="sidebar" campaign="church_detail" />

            {/* Quick Actions */}
            <ChurchQuickActions
              churchId={church.id}
              churchName={church.name}
              googleMapsUrl={googleMapsUrl}
              website={church.website}
              phone={church.phone}
            />

            {/* Nearby Churches by geographic proximity */}
            {nearbyChurches.length > 0 && (
              <NearbyChurches
                churches={nearbyChurches}
                currentChurchId={church.id}
                currentCity={church.city}
              />
            )}

            {/* Related Churches for internal linking */}
            <RelatedChurches churches={relatedChurches} currentCity={church.city} />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="bottom" campaign="church_detail" />
        </div>
      </div>
    </>
  );
}

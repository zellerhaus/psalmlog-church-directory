import { Metadata } from 'next';
import Script from 'next/script';
import QuizContainer from '@/components/QuizContainer';
import Breadcrumbs from '@/components/Breadcrumbs';
import PsalmlogCTA from '@/components/PsalmlogCTA';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

// JSON-LD structured data for FAQ rich results
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the church quiz work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our quiz asks 8 questions about your worship preferences, community needs, and spiritual priorities. Based on your answers, we match you with church types that align with what you\'re looking for. Then you can search for matching churches in your area.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this quiz only for one denomination?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No! Our quiz covers all major Christian denominations and worship styles. Whether you\'re drawn to traditional liturgy, contemporary worship, or something in between, we\'ll help you find churches that match your preferences.',
      },
    },
    {
      '@type': 'Question',
      name: 'I\'m new to church. Can I still take this quiz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! This quiz is perfect for first-timers. We explain each option in simple terms so you can make informed choices, even if you\'re not familiar with church traditions yet.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you save my answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We don\'t store your quiz answers. Your results are calculated in real-time and only you see them. If you choose to enter your email for a personalized guide, we\'ll only use it to send you helpful content.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if I don\'t agree with my results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The quiz provides suggestions based on general patterns, but every person and every church is unique. We also show you secondary matches and encourage you to visit multiple churches before making a decision.',
      },
    },
  ],
};

// WebApplication schema for the quiz tool
const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Church Finder Quiz',
  description: 'A free interactive quiz to help you discover what type of church matches your worship style, community needs, and spiritual priorities.',
  url: `${SITE_URL}/churches/quiz`,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: {
    '@type': 'Organization',
    name: 'Psalmlog',
    url: SITE_URL,
  },
};

export const metadata: Metadata = {
  title: 'What Church Is Right for Me? | Free Church Finder Quiz',
  description:
    'Take our free 2-minute quiz to discover what type of church matches your worship style, community needs, and spiritual priorities. Find your church home today.',
  keywords: [
    'church quiz',
    'find my church',
    'what church is right for me',
    'church finder quiz',
    'denomination quiz',
    'worship style quiz',
    'church matching',
    'find a church',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'What Church Is Right for Me? | Free Quiz',
    description:
      'Discover your ideal church type in just 2 minutes. Get matched based on worship style, community needs, and what matters most to you.',
    url: `${SITE_URL}/churches/quiz`,
    images: [
      {
        url: `${SITE_URL}/og/quiz`,
        width: 1200,
        height: 630,
        alt: 'Church Finder Quiz - Find Your Perfect Church Match',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Church Is Right for Me? | Free Quiz',
    description:
      'Discover your ideal church type in just 2 minutes. Get matched based on worship style, community needs, and what matters most to you.',
    images: [`${SITE_URL}/og/quiz`],
  },
  alternates: {
    canonical: `${SITE_URL}/churches/quiz`,
  },
};

export default function ChurchQuizPage() {
  return (
    <>
      {/* Structured data for SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />

      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Church Quiz' }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
            What Church Is Right for Me?
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Finding the right church can feel overwhelming. Take our quick quiz to discover
            where you&apos;ll feel most at home.
          </p>
        </div>

        {/* Quiz Component */}
        <QuizContainer />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                How does the church quiz work?
              </h3>
              <p className="text-[var(--muted)]">
                Our quiz asks 8 questions about your worship preferences, community needs, and
                spiritual priorities. Based on your answers, we match you with church types
                that align with what you&apos;re looking for. Then you can search for matching
                churches in your area.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Is this quiz only for one denomination?
              </h3>
              <p className="text-[var(--muted)]">
                No! Our quiz covers all major Christian denominations and worship styles.
                Whether you&apos;re drawn to traditional liturgy, contemporary worship, or
                something in between, we&apos;ll help you find churches that match your
                preferences.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                I&apos;m new to church. Can I still take this quiz?
              </h3>
              <p className="text-[var(--muted)]">
                Absolutely! This quiz is perfect for first-timers. We explain each option
                in simple terms so you can make informed choices, even if you&apos;re not
                familiar with church traditions yet.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Do you save my answers?
              </h3>
              <p className="text-[var(--muted)]">
                We don&apos;t store your quiz answers. Your results are calculated in real-time
                and only you see them. If you choose to enter your email for a personalized
                guide, we&apos;ll only use it to send you helpful content.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                What if I don&apos;t agree with my results?
              </h3>
              <p className="text-[var(--muted)]">
                The quiz provides suggestions based on general patterns, but every person
                and every church is unique. We also show you secondary matches and encourage
                you to visit multiple churches before making a decision.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <PsalmlogCTA variant="bottom" campaign="quiz_page" />
        </div>

        {/* SEO Content */}
        <div className="mt-16 max-w-3xl mx-auto prose">
          <h2>Finding the Right Church for You</h2>
          <p>
            Choosing a church is one of the most important decisions you can make for your
            spiritual journey. The right church community can provide support, growth, and
            meaningful connections that last a lifetime.
          </p>

          <h3>What Makes a Church the &quot;Right&quot; One?</h3>
          <p>
            There&apos;s no one-size-fits-all answer. Some people thrive in large, contemporary
            congregations with modern music and technology. Others find deeper connection in
            small, traditional churches with historic liturgy. Many prefer something in between.
          </p>
          <p>
            The key factors to consider include:
          </p>
          <ul>
            <li><strong>Worship style</strong> - Traditional hymns vs. contemporary songs</li>
            <li><strong>Community size</strong> - Intimate gatherings vs. larger congregations</li>
            <li><strong>Programs</strong> - Kids ministry, youth groups, small groups</li>
            <li><strong>Teaching approach</strong> - Verse-by-verse study vs. topical series</li>
            <li><strong>Denominational tradition</strong> - Historic roots vs. non-denominational</li>
          </ul>

          <h3>Using This Quiz to Start Your Search</h3>
          <p>
            Our church finder quiz helps you clarify what matters most to you. By answering
            questions about your preferences and priorities, you&apos;ll get matched with church
            types that align with your needs. From there, you can search our directory of over
            100,000 churches to find specific congregations in your area.
          </p>

          <h3>Tips for Visiting a New Church</h3>
          <p>
            Once you have your quiz results, we recommend visiting 2-3 churches before making
            a decision. Arrive a few minutes early, introduce yourself to a greeter, and
            don&apos;t feel pressured to participate in everything on your first visit. Most
            churches welcome visitors and are happy to answer questions.
          </p>
        </div>
      </div>
    </>
  );
}

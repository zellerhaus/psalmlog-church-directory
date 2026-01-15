'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How do I find a church near me?',
    answer: 'Use our search bar at the top of the page to enter your city name or zip code. You\'ll see a list of churches in your area, which you can filter by denomination, worship style, and available programs like youth groups or children\'s ministry.',
  },
  {
    question: 'What should I wear to church for the first time?',
    answer: 'Dress codes vary widely between churches. Traditional or liturgical churches (Catholic, Episcopal, Lutheran) often lean toward business casual or dressy attire. Contemporary and non-denominational churches are typically more casual—jeans and a nice top are usually fine. When in doubt, smart casual is a safe choice. Many churches include dress code guidance in their visitor information.',
  },
  {
    question: 'What happens during a typical church service?',
    answer: 'Most Protestant services include worship music (hymns or contemporary songs), prayer, Scripture reading, a sermon or message, and an offering. Some churches include communion weekly, others monthly. Services typically last 60-90 minutes. Catholic and Orthodox services follow a more structured liturgy with specific prayers and rituals. Our church listings include service format details when available.',
  },
  {
    question: 'What\'s the difference between denominations?',
    answer: 'Denominations differ in their interpretation of Scripture, worship practices, and church governance. For example, Baptists emphasize believer\'s baptism by immersion, while Presbyterians practice infant baptism. Catholics and Orthodox churches have hierarchical leadership and sacramental traditions. Non-denominational churches are independent and often contemporary in style. Each church\'s listing includes denomination information to help you understand their tradition.',
  },
  {
    question: 'Should I visit multiple churches before choosing one?',
    answer: 'Yes, visiting several churches is a great approach. Give each church at least 2-3 visits before deciding—first impressions don\'t always tell the whole story. Pay attention to how welcomed you feel, whether the teaching resonates with you, and if there are opportunities to connect with others. Many people visit 5-10 churches before finding their church home.',
  },
  {
    question: 'How do I know if a church is right for me?',
    answer: 'Consider these factors: Do you agree with their core beliefs? Does the worship style help you connect with God? Are there people in similar life stages? Do they offer programs that meet your family\'s needs? Do you feel welcomed and valued? Is the teaching biblically grounded and applicable to your life? Trust takes time to build, so give yourself grace in the process.',
  },
  {
    question: 'What if I haven\'t been to church in years?',
    answer: 'You\'re not alone—many people return to church after long breaks. Churches welcome visitors at all stages of their faith journey. You don\'t need to know all the songs, prayers, or rituals. Most churches have a visitor center or welcome team to help you feel comfortable. Start by attending a regular Sunday service and don\'t feel pressured to participate in everything right away.',
  },
  {
    question: 'Are children welcome at church services?',
    answer: 'Yes! Most churches love having children. Many offer dedicated programs during the service including nursery care for infants and toddlers, children\'s church for elementary ages, and youth groups for teens. Some churches also have family services where children stay with parents. Check our listings for specific children\'s ministry information, and don\'t worry if your child makes noise—churches expect it!',
  },
];

export default function HomeFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // FAQ Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container-page">
        <div className="max-w-3xl mx-auto">
          <p className="section-label text-center mb-3">Common Questions</p>
          <h2 className="text-2xl font-bold text-center mb-4 font-serif">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-[var(--muted)] mb-10">
            Answers to common questions about finding and visiting churches.
          </p>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[var(--border)] rounded-lg overflow-hidden bg-white"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[var(--secondary)] transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-[var(--foreground)]">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-[var(--muted)] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

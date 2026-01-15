'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQ, FAQCategory } from '@/types/content';
import { FAQ_CATEGORY_LABELS } from '@/lib/services/faq-templates';

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  showCategories?: boolean;
}

export default function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
  showCategories = false,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Generate JSON-LD schema for FAQ rich snippets
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

  // Group FAQs by category if showCategories is true
  const groupedFAQs = showCategories
    ? groupByCategory(faqs)
    : { all: faqs };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-12">
      {/* JSON-LD Schema for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 className="text-2xl font-bold mb-6 font-serif text-[var(--foreground)]">
        {title}
      </h2>

      {showCategories ? (
        // Render grouped by category
        Object.entries(groupedFAQs).map(([category, categoryFaqs]) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
              {FAQ_CATEGORY_LABELS[category as FAQCategory] || category}
            </h3>
            <div className="space-y-3">
              {categoryFaqs.map((faq, index) => (
                <FAQItem
                  key={`${category}-${index}`}
                  faq={faq}
                  isOpen={openIndex === faqs.indexOf(faq)}
                  onToggle={() => toggleFAQ(faqs.indexOf(faq))}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Render flat list
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--secondary)] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[var(--foreground)] pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-[var(--muted)] leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// Helper function to group FAQs by category
function groupByCategory(faqs: FAQ[]): Record<string, FAQ[]> {
  const grouped: Record<string, FAQ[]> = {};

  for (const faq of faqs) {
    const category = faq.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(faq);
  }

  return grouped;
}

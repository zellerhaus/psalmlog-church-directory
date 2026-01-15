/**
 * FAQ Templates for State and City Pages
 *
 * Templates generate contextual FAQs with dynamic variables.
 * Designed to work with Google's FAQ rich snippet schema.
 */

import type { FAQ, FAQCategory, TemplateContext } from '@/types/content';
import { interpolateTemplate } from './content-templates';

interface FAQTemplate {
  questionTemplate: string;
  answerTemplate: string;
  category: FAQCategory;
  minChurches?: number; // Minimum churches required to show this FAQ
}

// FAQ templates for "Finding the Right Church" category
const FINDING_CHURCH_TEMPLATES: FAQTemplate[] = [
  {
    questionTemplate:
      'How do I find a {topDenomination} church in {locationName}?',
    answerTemplate:
      '{locationName} has {topDenominationCount} {topDenomination} churches. Use the filters on this page to narrow down by worship style, programs offered, and location. You can also filter for specific amenities like {topWorshipStyle} services or children\'s ministry programs.',
    category: 'finding-church',
  },
  {
    questionTemplate: 'What types of churches are in {locationName}?',
    answerTemplate:
      '{locationName} has {churchCount} churches representing various denominations including {topDenomination}, {denominationList}. Worship styles range from contemporary to traditional, with {topWorshipStyle} being the most common.',
    category: 'finding-church',
  },
  {
    questionTemplate:
      'How many churches are there in {locationName}?',
    answerTemplate:
      'There are {churchCount} churches in {locationName}. The largest denomination is {topDenomination} with {topDenominationCount} congregations. Other well-represented denominations include {denominationList}.',
    category: 'finding-church',
  },
];

// FAQ templates for "Denomination Comparisons" category
const DENOMINATION_TEMPLATES: FAQTemplate[] = [
  {
    questionTemplate:
      'What is the most common church denomination in {locationName}?',
    answerTemplate:
      '{topDenomination} is the most common denomination in {locationName}, with {topDenominationCount} out of {churchCount} churches ({topDenominationPercent}%). Other denominations with significant presence include {denominationList}.',
    category: 'denominations',
  },
  {
    questionTemplate:
      'Are there non-denominational churches in {locationName}?',
    answerTemplate:
      'Yes, {locationName} has non-denominational and interdenominational churches among its {churchCount} congregations. These churches typically focus on core Christian beliefs while allowing flexibility in worship style and practice. Use the denomination filter to find them.',
    category: 'denominations',
  },
];

// FAQ templates for "Programs & Family" category
const PROGRAMS_TEMPLATES: FAQTemplate[] = [
  {
    questionTemplate:
      'Which churches in {locationName} have kids ministry programs?',
    answerTemplate:
      '{kidsMinistryCount} churches in {locationName} ({kidsMinistryPercent}%) offer dedicated children\'s ministry programs. These typically include Sunday School, children\'s church during the main service, and nursery care for infants and toddlers.',
    category: 'programs',
    minChurches: 3,
  },
  {
    questionTemplate:
      'Are there churches with youth groups in {locationName}?',
    answerTemplate:
      'Yes, {youthGroupCount} churches in {locationName} ({youthGroupPercent}%) have active youth group programs for teenagers. Youth ministries typically meet weekly and include Bible study, fellowship activities, service projects, and social events.',
    category: 'programs',
    minChurches: 3,
  },
  {
    questionTemplate:
      'Which churches in {locationName} offer small groups?',
    answerTemplate:
      '{smallGroupsCount} churches ({smallGroupsPercent}%) in {locationName} offer small group ministries. Small groups provide opportunities for deeper fellowship, Bible study, prayer, and community outside of regular Sunday services. They often meet in homes during the week.',
    category: 'programs',
    minChurches: 3,
  },
  {
    questionTemplate:
      'What family programs do churches in {locationName} offer?',
    answerTemplate:
      'Churches in {locationName} offer various family programs: {kidsMinistryPercent}% have children\'s ministry, {youthGroupPercent}% offer youth groups, and {smallGroupsPercent}% have small groups for adults. Many also offer family worship services, parenting classes, and marriage enrichment programs.',
    category: 'programs',
    minChurches: 5,
  },
];

// FAQ templates for "Visiting" category
const VISITING_TEMPLATES: FAQTemplate[] = [
  {
    questionTemplate:
      'What should I expect when visiting a church in {locationName} for the first time?',
    answerTemplate:
      'Churches in {locationName} are generally welcoming to visitors. Most offer {topWorshipStyle} worship services lasting 60-90 minutes. Dress codes vary from casual to business casual. Arrive 10-15 minutes early to find parking and get oriented. Greeters will help you find your way.',
    category: 'visiting',
  },
  {
    questionTemplate:
      'What is the dress code for churches in {locationName}?',
    answerTemplate:
      'Dress codes at churches in {locationName} vary by congregation. {topDenomination} churches typically range from business casual to casual attire. Contemporary-style churches tend to be more casual, while traditional or liturgical churches may lean toward business casual. When in doubt, smart casual is appropriate.',
    category: 'visiting',
  },
  {
    questionTemplate:
      'When do churches in {locationName} hold services?',
    answerTemplate:
      'Most churches in {locationName} hold their primary services on Sunday mornings, typically between 9:00 AM and 11:00 AM. Many also offer additional services on Sunday evenings or Wednesday nights. Check individual church listings for specific service times.',
    category: 'visiting',
  },
];

// State-specific FAQ templates (only shown for state pages)
const STATE_SPECIFIC_TEMPLATES: FAQTemplate[] = [
  {
    questionTemplate:
      'How many cities in {locationName} have churches?',
    answerTemplate:
      '{locationName} has {churchCount} churches spread across {cityCount} cities. Use our directory to browse churches by city, or search for a specific location to find congregations near you.',
    category: 'finding-church',
  },
];

/**
 * Calculate top denomination percentage for use in templates
 */
function getTopDenominationPercent(context: TemplateContext): string {
  if (context.churchCount === 0) return '0';
  return Math.round(
    (context.topDenominationCount / context.churchCount) * 100
  ).toString();
}

/**
 * Extend context with calculated fields
 */
function extendContext(context: TemplateContext): TemplateContext & { topDenominationPercent: string } {
  return {
    ...context,
    topDenominationPercent: getTopDenominationPercent(context),
  };
}

/**
 * Generate FAQs from templates for a given context
 */
export function generateFAQs(context: TemplateContext): FAQ[] {
  const extendedContext = extendContext(context);
  const faqs: FAQ[] = [];
  const isState = context.locationType === 'state';

  // Combine all applicable templates
  const templates = [
    ...FINDING_CHURCH_TEMPLATES,
    ...DENOMINATION_TEMPLATES,
    ...PROGRAMS_TEMPLATES,
    ...VISITING_TEMPLATES,
    ...(isState ? STATE_SPECIFIC_TEMPLATES : []),
  ];

  for (const template of templates) {
    // Skip if minimum church count not met
    if (template.minChurches && context.churchCount < template.minChurches) {
      continue;
    }

    // Interpolate the template
    const question = interpolateTemplate(
      template.questionTemplate,
      extendedContext as TemplateContext
    ).replace(/{topDenominationPercent}/g, extendedContext.topDenominationPercent);

    const answer = interpolateTemplate(
      template.answerTemplate,
      extendedContext as TemplateContext
    ).replace(/{topDenominationPercent}/g, extendedContext.topDenominationPercent);

    faqs.push({
      question,
      answer,
      category: template.category,
    });
  }

  return faqs;
}

/**
 * Get FAQs filtered by category
 */
export function getFAQsByCategory(
  faqs: FAQ[],
  category: FAQCategory
): FAQ[] {
  return faqs.filter((faq) => faq.category === category);
}

/**
 * Get unique categories from a list of FAQs
 */
export function getFAQCategories(faqs: FAQ[]): FAQCategory[] {
  const categories = new Set(faqs.map((faq) => faq.category));
  return Array.from(categories);
}

/**
 * Category display names for UI
 */
export const FAQ_CATEGORY_LABELS: Record<FAQCategory, string> = {
  'finding-church': 'Finding a Church',
  denominations: 'Denominations',
  programs: 'Programs & Ministries',
  visiting: 'Visiting',
};

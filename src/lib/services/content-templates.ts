/**
 * Content Templates for State and City Pages
 *
 * Multiple variations ensure unique content across pages.
 * Templates use {variable} placeholders that get interpolated.
 */

import type { TemplateContext } from '@/types/content';

// State overview templates - 3 variations for differentiation
export const STATE_OVERVIEW_TEMPLATES = [
  // Variant 0: Statistics-focused
  `{locationName} is home to {churchCount} churches across {cityCount} cities, offering diverse worship experiences for Christians of all backgrounds. The most common denomination is {topDenomination}, with {topDenominationCount} congregations, followed by {denominationList}. Whether you prefer {topWorshipStyle} worship or a more traditional service, you'll find a welcoming community in {locationName}.`,

  // Variant 1: Community-focused
  `The Christian community in {locationName} thrives with {churchCount} active congregations spanning {cityCount} cities. From {topDenomination} churches to non-denominational fellowships, {locationName} offers a rich tapestry of faith traditions. {kidsMinistryPercent}% of churches offer dedicated children's ministries, making it easy for families to find their spiritual home.`,

  // Variant 2: Visitor-focused
  `Looking for a church in {locationName}? With {churchCount} congregations to choose from across {cityCount} cities, you're sure to find the right fit. {topDenomination} is the most represented denomination with {topDenominationCount} locations, but you'll also find strong presences of {denominationList}. Most churches offer {topWorshipStyle} worship services.`,
];

// City overview templates - 3 variations
export const CITY_OVERVIEW_TEMPLATES = [
  // Variant 0: Statistics-focused
  `{locationName}, {stateAbbr} has {churchCount} churches serving the local community. The area is known for its {topDenomination} heritage, with {topDenominationCount} congregations, alongside {denominationList}. {topWorshipStyle} worship is the predominant style, though you'll find options for every preference.`,

  // Variant 1: Family-focused
  `Whether you're new to {locationName} or searching for a new church home, you'll discover {churchCount} welcoming congregations in the area. {topDenomination} churches lead with {topDenominationCount} locations. {kidsMinistryPercent}% offer children's programs, and {smallGroupsPercent}% have small group ministries for deeper fellowship.`,

  // Variant 2: Diversity-focused
  `The {locationName} church community includes {churchCount} congregations representing diverse Christian traditions. From {topDenomination} to {denominationList}, you'll find churches that match your theological convictions. Most offer {topWorshipStyle} worship experiences.`,
];

// State visitor guide templates
export const STATE_VISITOR_GUIDE_TEMPLATES = [
  // Variant 0
  `When visiting a church in {locationName} for the first time, you can expect a warm welcome. Most congregations offer {topWorshipStyle} services, with Sunday being the primary worship day.

Dress codes vary by denomination and location - {topDenomination} churches typically range from business casual to casual attire. When in doubt, smart casual is always appropriate.

Arrive 10-15 minutes early to find parking, locate the sanctuary, and get oriented. Greeters are usually stationed at entrances to help first-time visitors. Many churches in {locationName} offer visitor information packets and some have designated parking spots for guests.`,

  // Variant 1
  `Churches across {locationName} are known for their hospitality toward visitors. With {churchCount} congregations to choose from, each offers its own unique atmosphere while maintaining a welcoming spirit.

Most services last 60-90 minutes and include worship music, prayer, and a sermon. {topWorshipStyle} worship is common, though styles vary. Children's programming is available at {kidsMinistryPercent}% of churches during the main service.

Visitors can typically expect to be greeted but not singled out. Some churches have connection cards for those who want more information, but there's never pressure to fill them out.`,
];

// City visitor guide templates
export const CITY_VISITOR_GUIDE_TEMPLATES = [
  // Variant 0
  `Churches in {locationName} welcome visitors warmly. The {churchCount} congregations here offer various worship styles, with {topWorshipStyle} being most common among {topDenomination} churches.

Dress varies from casual to business casual depending on the congregation. {kidsMinistryPercent}% of churches offer children's programs during services.

First-time visitors should arrive a few minutes early to find parking and get oriented. Greeters will help you find your way to the sanctuary and answer any questions.`,

  // Variant 1
  `Planning to visit a church in {locationName}? You'll find {churchCount} welcoming congregations eager to meet you. The local church community represents various traditions including {topDenomination} and {denominationList}.

Service times vary but Sunday morning remains the most popular. Expect {topWorshipStyle} worship at most churches. Families will appreciate that {kidsMinistryPercent}% of local churches have dedicated children's ministries.

Most churches here don't require you to stand up or introduce yourself as a visitor - you can participate at whatever level feels comfortable.`,
];

/**
 * Interpolate template variables with actual values
 */
export function interpolateTemplate(
  template: string,
  context: TemplateContext
): string {
  const denominationListStr =
    context.denominationList.length > 0
      ? context.denominationList.join(', ')
      : 'various denominations';

  return template
    .replace(/{locationName}/g, context.locationName)
    .replace(/{stateAbbr}/g, context.stateAbbr || '')
    .replace(/{stateName}/g, context.stateName || '')
    .replace(/{churchCount}/g, context.churchCount.toLocaleString())
    .replace(/{cityCount}/g, context.cityCount?.toLocaleString() || '0')
    .replace(/{topDenomination}/g, context.topDenomination)
    .replace(
      /{topDenominationCount}/g,
      context.topDenominationCount.toLocaleString()
    )
    .replace(/{topWorshipStyle}/g, context.topWorshipStyle)
    .replace(/{denominationList}/g, denominationListStr)
    .replace(
      /{kidsMinistryCount}/g,
      context.kidsMinistryCount.toLocaleString()
    )
    .replace(/{kidsMinistryPercent}/g, context.kidsMinistryPercent.toString())
    .replace(/{youthGroupCount}/g, context.youthGroupCount.toLocaleString())
    .replace(/{youthGroupPercent}/g, context.youthGroupPercent.toString())
    .replace(/{smallGroupsCount}/g, context.smallGroupsCount.toLocaleString())
    .replace(/{smallGroupsPercent}/g, context.smallGroupsPercent.toString());
}

/**
 * Get a template by variant index (with fallback to first if out of bounds)
 */
export function getStateOverviewTemplate(variant: number): string {
  return (
    STATE_OVERVIEW_TEMPLATES[variant % STATE_OVERVIEW_TEMPLATES.length] ||
    STATE_OVERVIEW_TEMPLATES[0]
  );
}

export function getCityOverviewTemplate(variant: number): string {
  return (
    CITY_OVERVIEW_TEMPLATES[variant % CITY_OVERVIEW_TEMPLATES.length] ||
    CITY_OVERVIEW_TEMPLATES[0]
  );
}

export function getStateVisitorGuideTemplate(variant: number): string {
  return (
    STATE_VISITOR_GUIDE_TEMPLATES[
      variant % STATE_VISITOR_GUIDE_TEMPLATES.length
    ] || STATE_VISITOR_GUIDE_TEMPLATES[0]
  );
}

export function getCityVisitorGuideTemplate(variant: number): string {
  return (
    CITY_VISITOR_GUIDE_TEMPLATES[
      variant % CITY_VISITOR_GUIDE_TEMPLATES.length
    ] || CITY_VISITOR_GUIDE_TEMPLATES[0]
  );
}

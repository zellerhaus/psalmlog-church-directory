/**
 * Location Content Service
 *
 * Generates pre-computed content for state and city pages including:
 * - Aggregated statistics from church data
 * - AI-enhanced overview and visitor guide content
 * - FAQ content for Google rich snippets
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  LocationStats,
  StateContent,
  CityContent,
  TemplateContext,
  FAQ,
} from '@/types/content';
import {
  interpolateTemplate,
  getStateOverviewTemplate,
  getCityOverviewTemplate,
  getStateVisitorGuideTemplate,
  getCityVisitorGuideTemplate,
} from './content-templates';
import { generateFAQs } from './faq-templates';

// AI Provider interface (reusing pattern from church-enrichment)
export interface AIProvider {
  name: string;
  generateStateContent(
    stateName: string,
    stateAbbr: string,
    stats: LocationStats
  ): Promise<{
    overview: string;
    visitorGuide: string;
    historicalContext?: string;
  }>;
  generateCityContent(
    cityName: string,
    stateAbbr: string,
    stateName: string,
    stats: LocationStats
  ): Promise<{
    overview: string;
    visitorGuide: string;
    communityInsights?: string;
  }>;
}

export interface ContentGenerationOptions {
  forceRegenerate?: boolean;
  templateVariant?: number;
  skipAI?: boolean;
}

export class LocationContentService {
  private supabase: SupabaseClient;
  private aiProvider: AIProvider | null;

  constructor(supabase: SupabaseClient, aiProvider: AIProvider | null = null) {
    this.supabase = supabase;
    this.aiProvider = aiProvider;
  }

  /**
   * Compute statistics for a state from church data
   */
  async computeStateStats(stateAbbr: string): Promise<LocationStats> {
    // Fetch all churches with pagination to avoid 1000 row limit
    const churches: {
      denomination: string | null;
      worship_style: string[] | null;
      has_kids_ministry: boolean | null;
      has_youth_group: boolean | null;
      has_small_groups: boolean | null;
      city: string;
    }[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('churches')
        .select(
          'denomination, worship_style, has_kids_ministry, has_youth_group, has_small_groups, city'
        )
        .eq('state_abbr', stateAbbr)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error(`Error fetching churches for ${stateAbbr}:`, error);
        break;
      }

      if (data && data.length > 0) {
        churches.push(...data);
        offset += PAGE_SIZE;
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (churches.length === 0) {
      return this.emptyStats();
    }

    const denominations: Record<string, number> = {};
    const worshipStyles: Record<string, number> = {};
    const cities = new Set<string>();
    let kidsMinistry = 0;
    let youthGroup = 0;
    let smallGroups = 0;

    for (const church of churches) {
      cities.add(church.city);

      if (church.denomination) {
        denominations[church.denomination] =
          (denominations[church.denomination] || 0) + 1;
      }

      if (church.worship_style && Array.isArray(church.worship_style)) {
        for (const style of church.worship_style) {
          worshipStyles[style] = (worshipStyles[style] || 0) + 1;
        }
      }

      if (church.has_kids_ministry) kidsMinistry++;
      if (church.has_youth_group) youthGroup++;
      if (church.has_small_groups) smallGroups++;
    }

    return {
      church_count: churches.length,
      city_count: cities.size,
      denominations,
      worship_styles: worshipStyles,
      programs: {
        kids_ministry: kidsMinistry,
        youth_group: youthGroup,
        small_groups: smallGroups,
      },
    };
  }

  /**
   * Compute statistics for a city from church data
   */
  async computeCityStats(
    stateAbbr: string,
    cityName: string
  ): Promise<LocationStats> {
    const { data: churches, error } = await this.supabase
      .from('churches')
      .select(
        'denomination, worship_style, has_kids_ministry, has_youth_group, has_small_groups'
      )
      .eq('state_abbr', stateAbbr)
      .ilike('city', cityName);

    if (error || !churches || churches.length === 0) {
      return this.emptyStats();
    }

    const denominations: Record<string, number> = {};
    const worshipStyles: Record<string, number> = {};
    let kidsMinistry = 0;
    let youthGroup = 0;
    let smallGroups = 0;

    for (const church of churches) {
      if (church.denomination) {
        denominations[church.denomination] =
          (denominations[church.denomination] || 0) + 1;
      }

      if (church.worship_style && Array.isArray(church.worship_style)) {
        for (const style of church.worship_style) {
          worshipStyles[style] = (worshipStyles[style] || 0) + 1;
        }
      }

      if (church.has_kids_ministry) kidsMinistry++;
      if (church.has_youth_group) youthGroup++;
      if (church.has_small_groups) smallGroups++;
    }

    return {
      church_count: churches.length,
      denominations,
      worship_styles: worshipStyles,
      programs: {
        kids_ministry: kidsMinistry,
        youth_group: youthGroup,
        small_groups: smallGroups,
      },
    };
  }

  /**
   * Build template context from stats
   */
  buildTemplateContext(
    locationName: string,
    locationType: 'state' | 'city',
    stats: LocationStats,
    stateName?: string,
    stateAbbr?: string
  ): TemplateContext {
    const sortedDenoms = Object.entries(stats.denominations).sort(
      (a, b) => b[1] - a[1]
    );
    const sortedStyles = Object.entries(stats.worship_styles).sort(
      (a, b) => b[1] - a[1]
    );

    const topDenom = sortedDenoms[0] || ['Non-denominational', 0];
    const topStyle = sortedStyles[0] || ['Contemporary', 0];

    const churchCount = stats.church_count || 1; // Avoid division by zero

    return {
      locationName,
      locationType,
      stateName,
      stateAbbr,
      churchCount: stats.church_count,
      cityCount: stats.city_count,
      topDenomination: topDenom[0],
      topDenominationCount: topDenom[1],
      topWorshipStyle: topStyle[0],
      denominationList: sortedDenoms.slice(1, 5).map((d) => d[0]),
      kidsMinistryCount: stats.programs.kids_ministry,
      kidsMinistryPercent: Math.round(
        (stats.programs.kids_ministry / churchCount) * 100
      ),
      youthGroupCount: stats.programs.youth_group,
      youthGroupPercent: Math.round(
        (stats.programs.youth_group / churchCount) * 100
      ),
      smallGroupsCount: stats.programs.small_groups,
      smallGroupsPercent: Math.round(
        (stats.programs.small_groups / churchCount) * 100
      ),
    };
  }

  /**
   * Generate content for a state
   */
  async generateStateContent(
    stateAbbr: string,
    stateName: string,
    options: ContentGenerationOptions = {}
  ): Promise<Omit<StateContent, 'id' | 'created_at' | 'updated_at'>> {
    // Compute fresh stats
    const stats = await this.computeStateStats(stateAbbr);
    const context = this.buildTemplateContext(stateName, 'state', stats);

    // Select template variant (for uniqueness)
    const variant =
      options.templateVariant ?? Math.floor(Math.random() * 3);

    // Generate base content from templates
    let overview = interpolateTemplate(
      getStateOverviewTemplate(variant),
      context
    );
    let visitorGuide = interpolateTemplate(
      getStateVisitorGuideTemplate(variant),
      context
    );
    let historicalContext = '';

    // Enhance with AI if available and not skipped
    if (this.aiProvider && !options.skipAI && stats.church_count >= 5) {
      try {
        const aiContent = await this.aiProvider.generateStateContent(
          stateName,
          stateAbbr,
          stats
        );
        if (aiContent.overview) overview = aiContent.overview;
        if (aiContent.visitorGuide) visitorGuide = aiContent.visitorGuide;
        if (aiContent.historicalContext)
          historicalContext = aiContent.historicalContext;
      } catch (error) {
        console.warn(
          `AI generation failed for state ${stateAbbr}, using templates:`,
          error
        );
      }
    }

    // Generate FAQs
    const faqs = generateFAQs(context);

    return {
      state_abbr: stateAbbr,
      stats,
      overview,
      visitor_guide: visitorGuide,
      historical_context: historicalContext || null,
      faqs,
      content_version: 1,
      template_variant: variant,
      ai_generated_at: this.aiProvider && !options.skipAI ? new Date().toISOString() : null,
      stats_computed_at: new Date().toISOString(),
    };
  }

  /**
   * Generate content for a city
   */
  async generateCityContent(
    citySlug: string,
    cityName: string,
    stateAbbr: string,
    stateName: string,
    options: ContentGenerationOptions = {}
  ): Promise<Omit<CityContent, 'id' | 'created_at' | 'updated_at'>> {
    // Compute fresh stats
    const stats = await this.computeCityStats(stateAbbr, cityName);
    const context = this.buildTemplateContext(
      cityName,
      'city',
      stats,
      stateName,
      stateAbbr
    );

    // Select template variant
    const variant =
      options.templateVariant ?? Math.floor(Math.random() * 3);

    // Generate base content from templates
    let overview = interpolateTemplate(
      getCityOverviewTemplate(variant),
      context
    );
    let visitorGuide = interpolateTemplate(
      getCityVisitorGuideTemplate(variant),
      context
    );
    let communityInsights = '';

    // Enhance with AI if available and city has enough data
    if (this.aiProvider && !options.skipAI && stats.church_count >= 5) {
      try {
        const aiContent = await this.aiProvider.generateCityContent(
          cityName,
          stateAbbr,
          stateName,
          stats
        );
        if (aiContent.overview) overview = aiContent.overview;
        if (aiContent.visitorGuide) visitorGuide = aiContent.visitorGuide;
        if (aiContent.communityInsights)
          communityInsights = aiContent.communityInsights;
      } catch (error) {
        console.warn(
          `AI generation failed for city ${cityName}, ${stateAbbr}, using templates:`,
          error
        );
      }
    }

    // Generate FAQs
    const faqs = generateFAQs(context);

    return {
      city_slug: citySlug,
      state_abbr: stateAbbr,
      city_name: cityName,
      stats,
      overview,
      visitor_guide: visitorGuide,
      community_insights: communityInsights || null,
      faqs,
      content_version: 1,
      template_variant: variant,
      ai_generated_at: this.aiProvider && !options.skipAI ? new Date().toISOString() : null,
      stats_computed_at: new Date().toISOString(),
    };
  }

  /**
   * Save state content to database
   */
  async saveStateContent(
    content: Omit<StateContent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    const { error } = await this.supabase.from('state_content').upsert(
      {
        state_abbr: content.state_abbr,
        stats: content.stats,
        overview: content.overview,
        visitor_guide: content.visitor_guide,
        historical_context: content.historical_context,
        faqs: content.faqs,
        content_version: content.content_version,
        template_variant: content.template_variant,
        ai_generated_at: content.ai_generated_at,
        stats_computed_at: content.stats_computed_at,
      },
      { onConflict: 'state_abbr' }
    );

    if (error) {
      throw new Error(`Failed to save state content: ${error.message}`);
    }
  }

  /**
   * Save city content to database
   */
  async saveCityContent(
    content: Omit<CityContent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    const { error } = await this.supabase.from('city_content').upsert(
      {
        city_slug: content.city_slug,
        state_abbr: content.state_abbr,
        city_name: content.city_name,
        stats: content.stats,
        overview: content.overview,
        visitor_guide: content.visitor_guide,
        community_insights: content.community_insights,
        faqs: content.faqs,
        content_version: content.content_version,
        template_variant: content.template_variant,
        ai_generated_at: content.ai_generated_at,
        stats_computed_at: content.stats_computed_at,
      },
      { onConflict: 'city_slug,state_abbr' }
    );

    if (error) {
      throw new Error(`Failed to save city content: ${error.message}`);
    }
  }

  /**
   * Get all unique cities with churches for a state
   */
  async getCitiesForState(
    stateAbbr: string
  ): Promise<{ city: string; slug: string }[]> {
    // Fetch all churches with pagination to avoid 1000 row limit
    const allRows: { city: string }[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('churches')
        .select('city')
        .eq('state_abbr', stateAbbr)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error(`Error fetching cities for ${stateAbbr}:`, error);
        break;
      }

      if (data && data.length > 0) {
        allRows.push(...data);
        offset += PAGE_SIZE;
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (allRows.length === 0) {
      return [];
    }

    // Get unique cities
    const uniqueCities = new Map<string, string>();
    for (const row of allRows) {
      const slug = row.city.toLowerCase().replace(/\s+/g, '-');
      if (!uniqueCities.has(slug)) {
        uniqueCities.set(slug, row.city);
      }
    }

    return Array.from(uniqueCities.entries()).map(([slug, city]) => ({
      city,
      slug,
    }));
  }

  private emptyStats(): LocationStats {
    return {
      church_count: 0,
      city_count: 0,
      denominations: {},
      worship_styles: {},
      programs: {
        kids_ministry: 0,
        youth_group: 0,
        small_groups: 0,
      },
    };
  }
}

/**
 * OpenAI-based AI Provider for location content
 */
export class OpenAILocationProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateStateContent(
    stateName: string,
    stateAbbr: string,
    stats: LocationStats
  ) {
    const prompt = this.buildStatePrompt(stateName, stateAbbr, stats);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, 'state');
  }

  async generateCityContent(
    cityName: string,
    stateAbbr: string,
    stateName: string,
    stats: LocationStats
  ) {
    const prompt = this.buildCityPrompt(cityName, stateAbbr, stateName, stats);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, 'city');
  }

  private buildStatePrompt(
    stateName: string,
    _stateAbbr: string,
    stats: LocationStats
  ): string {
    const topDenoms = Object.entries(stats.denominations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((d) => `${d[0]} (${d[1]})`)
      .join(', ');

    const topStyles = Object.entries(stats.worship_styles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((s) => `${s[0]} (${s[1]})`)
      .join(', ');

    // Format numbers with commas for the prompt
    const churchCountFormatted = stats.church_count.toLocaleString();
    const cityCountFormatted = stats.city_count?.toLocaleString() || '0';

    return `Generate compelling, SEO-friendly content for a church directory page about churches in ${stateName}.

EXACT Statistics (use these numbers precisely, do not round or approximate):
- Total churches: ${churchCountFormatted} (exactly ${stats.church_count})
- Total cities: ${cityCountFormatted} (exactly ${stats.city_count})
- Top denominations: ${topDenoms || 'Various'}
- Top worship styles: ${topStyles || 'Various'}
- Kids ministry: ${stats.programs.kids_ministry} churches (${Math.round((stats.programs.kids_ministry / stats.church_count) * 100)}%)
- Youth groups: ${stats.programs.youth_group} churches (${Math.round((stats.programs.youth_group / stats.church_count) * 100)}%)
- Small groups: ${stats.programs.small_groups} churches (${Math.round((stats.programs.small_groups / stats.church_count) * 100)}%)

IMPORTANT: Use the EXACT numbers provided above. Do not round "1,247 cities" to "1,000 cities" or similar approximations.

Return JSON with these fields:
{
  "overview": "2-3 sentences introducing the Christian community in ${stateName}. Start with vivid, colorful language that captures the essence of faith in this state - reference the region's character, heritage, or unique religious landscape. Naturally weave in the exact statistics. Mention the diversity of denominations (${topDenoms ? topDenoms.split(',')[0] : 'Baptist'} leading, etc.) and family-friendly programs. Write for someone searching for a church home. Do NOT start with 'Welcome to' or generic openings - be creative and engaging.",
  "visitorGuide": "Practical tips for visiting churches in ${stateName}. Include dress code expectations, common service times, and cultural notes specific to the region. 2-3 paragraphs. Be specific and helpful.",
  "historicalContext": "Brief but vivid history of Christianity in ${stateName}. Include interesting facts about how faith shaped the state's development, notable religious movements or revivals, immigration patterns that influenced denominations, or unique local traditions. 1-2 paragraphs. Make it engaging and memorable, not dry or generic."
}`;
  }

  private buildCityPrompt(
    cityName: string,
    stateAbbr: string,
    stateName: string,
    stats: LocationStats
  ): string {
    const topDenoms = Object.entries(stats.denominations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((d) => `${d[0]} (${d[1]})`)
      .join(', ');

    return `Generate SEO-friendly content for a church directory page about churches in ${cityName}, ${stateAbbr}.

Statistics:
- ${stats.church_count} churches in ${cityName}
- Top denominations: ${topDenoms || 'Various'}
- ${stats.programs.kids_ministry} with kids ministry, ${stats.programs.youth_group} with youth groups, ${stats.programs.small_groups} with small groups

Return JSON:
{
  "overview": "2-3 paragraph introduction about finding a church in ${cityName}, ${stateName}. Be specific to the local church landscape. Mention key denominations and worship styles.",
  "visitorGuide": "What to expect visiting churches in ${cityName}. Include local context, typical service times, parking tips. 1-2 paragraphs.",
  "communityInsights": "Brief insights about the church community in ${cityName}. Focus on community character and local traditions. 1 paragraph."
}`;
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? '';
  }

  private parseResponse(
    response: string,
    type: 'state' | 'city'
  ): {
    overview: string;
    visitorGuide: string;
    historicalContext?: string;
    communityInsights?: string;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          visitorGuide: parsed.visitorGuide || '',
          historicalContext: type === 'state' ? parsed.historicalContext || '' : undefined,
          communityInsights: type === 'city' ? parsed.communityInsights || '' : undefined,
        };
      }
    } catch {
      // Parse failed, return empty
    }
    return {
      overview: '',
      visitorGuide: '',
      historicalContext: type === 'state' ? '' : undefined,
      communityInsights: type === 'city' ? '' : undefined,
    };
  }
}

/**
 * Anthropic Claude-based AI Provider for location content
 */
export class AnthropicLocationProvider implements AIProvider {
  name = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateStateContent(
    stateName: string,
    stateAbbr: string,
    stats: LocationStats
  ) {
    const prompt = this.buildStatePrompt(stateName, stateAbbr, stats);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, 'state');
  }

  async generateCityContent(
    cityName: string,
    stateAbbr: string,
    stateName: string,
    stats: LocationStats
  ) {
    const prompt = this.buildCityPrompt(cityName, stateAbbr, stateName, stats);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, 'city');
  }

  private buildStatePrompt(
    stateName: string,
    _stateAbbr: string,
    stats: LocationStats
  ): string {
    const topDenoms = Object.entries(stats.denominations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((d) => `${d[0]} (${d[1]})`)
      .join(', ');

    const topStyles = Object.entries(stats.worship_styles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((s) => `${s[0]} (${s[1]})`)
      .join(', ');

    // Format numbers with commas for the prompt
    const churchCountFormatted = stats.church_count.toLocaleString();
    const cityCountFormatted = stats.city_count?.toLocaleString() || '0';

    return `Generate compelling content for a church directory page about ${stateName}.

EXACT Statistics (use precisely, no rounding):
- Churches: ${churchCountFormatted} (exactly ${stats.church_count})
- Cities: ${cityCountFormatted} (exactly ${stats.city_count})
- Denominations: ${topDenoms || 'Various'}
- Worship styles: ${topStyles || 'Various'}
- Programs: ${stats.programs.kids_ministry} kids ministry, ${stats.programs.youth_group} youth, ${stats.programs.small_groups} small groups

CRITICAL: Use exact numbers. Never round (e.g., don't say "1,000 cities" if the number is 1,247).

Return only valid JSON:
{
  "overview": "2-3 vivid sentences about ${stateName}'s Christian community. Start with colorful language capturing the state's faith heritage - its character, history, or religious landscape. Weave in exact statistics naturally. Mention denomination diversity and family programs. No generic 'Welcome to' openings.",
  "visitorGuide": "2-3 paragraphs of practical visitor tips for ${stateName} churches - dress codes, service times, regional cultural notes.",
  "historicalContext": "1-2 engaging paragraphs on Christianity's history in ${stateName}. Include interesting facts: how faith shaped the state, notable revivals, immigration influences on denominations, unique traditions. Make it memorable."
}`;
  }

  private buildCityPrompt(
    cityName: string,
    stateAbbr: string,
    _stateName: string,
    stats: LocationStats
  ): string {
    const topDenoms = Object.entries(stats.denominations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((d) => `${d[0]} (${d[1]})`)
      .join(', ');

    return `Generate SEO content for churches in ${cityName}, ${stateAbbr}.

Stats: ${stats.church_count} churches
Denominations: ${topDenoms || 'Various'}
Programs: ${stats.programs.kids_ministry} kids, ${stats.programs.youth_group} youth, ${stats.programs.small_groups} small groups

Return only valid JSON:
{
  "overview": "2-3 paragraphs about local churches",
  "visitorGuide": "1-2 paragraphs for visitors",
  "communityInsights": "1 paragraph on community character"
}`;
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text ?? '';
  }

  private parseResponse(
    response: string,
    type: 'state' | 'city'
  ): {
    overview: string;
    visitorGuide: string;
    historicalContext?: string;
    communityInsights?: string;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          visitorGuide: parsed.visitorGuide || '',
          historicalContext: type === 'state' ? parsed.historicalContext || '' : undefined,
          communityInsights: type === 'city' ? parsed.communityInsights || '' : undefined,
        };
      }
    } catch {
      // Parse failed
    }
    return {
      overview: '',
      visitorGuide: '',
      historicalContext: type === 'state' ? '' : undefined,
      communityInsights: type === 'city' ? '' : undefined,
    };
  }
}

/**
 * Create AI provider from environment variables
 */
export function createLocationAIProvider(): AIProvider | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicLocationProvider(
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
    );
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAILocationProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_MODEL || 'gpt-4o-mini'
    );
  }

  return null;
}

/**
 * Create content service from environment variables
 */
export function createLocationContentService(): LocationContentService | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured for location content service');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const aiProvider = createLocationAIProvider();

  return new LocationContentService(supabase, aiProvider);
}

/**
 * Church Enrichment Service
 *
 * Enriches church data by:
 * 1. Fetching and parsing the church website
 * 2. Using AI to extract/generate additional information
 * 3. Updating the database with enriched data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, Church, ServiceTime } from '@/types/database';

type ChurchUpdate = Database['public']['Tables']['churches']['Update'];

// Combined enrichment result from single API call
export interface CombinedEnrichment {
  description: string;
  whatToExpect: string;
}

// AI Provider interface for swappable AI backends
export interface AIProvider {
  name: string;
  generateDescription(church: ChurchContext): Promise<string>;
  generateWhatToExpect(church: ChurchContext): Promise<string>;
  generateCombinedEnrichment(church: ChurchContext): Promise<CombinedEnrichment>;
  extractChurchInfo(church: ChurchContext, websiteContent: string): Promise<ExtractedInfo>;
}

// Context passed to AI for generation
export interface ChurchContext {
  name: string;
  city: string;
  state: string;
  denomination?: string;
  website?: string;
  websiteContent?: string;
}

// Information extracted from website
export interface ExtractedInfo {
  denomination?: string;
  worshipStyle?: string[];
  serviceTimes?: ServiceTime[];
  hasKidsMinistry?: boolean;
  hasYouthGroup?: boolean;
  hasSmallGroups?: boolean;
  pastorName?: string;
  yearFounded?: number;
}

// Enrichment result
export interface EnrichmentResult {
  success: boolean;
  churchId: string;
  enrichedFields: string[];
  error?: string;
}

export class ChurchEnrichmentService {
  private supabase: SupabaseClient<Database>;
  private aiProvider: AIProvider;

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string,
    aiProvider: AIProvider
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    this.aiProvider = aiProvider;
  }

  /**
   * Enrich a single church by ID
   */
  async enrichChurch(churchId: string): Promise<EnrichmentResult> {
    const enrichedFields: string[] = [];

    try {
      // Fetch church data
      const { data, error: fetchError } = await this.supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single();

      const church = data as Church | null;

      if (fetchError || !church) {
        return {
          success: false,
          churchId,
          enrichedFields: [],
          error: fetchError?.message ?? 'Church not found',
        };
      }

      // Fetch website content if available
      let websiteContent: string | undefined;
      if (church.website) {
        try {
          websiteContent = await this.fetchWebsiteContent(church.website);
        } catch (error) {
          console.warn(`Failed to fetch website for ${church.name}:`, error);
        }
      }

      const context: ChurchContext = {
        name: church.name,
        city: church.city,
        state: church.state,
        denomination: church.denomination ?? undefined,
        website: church.website ?? undefined,
        websiteContent,
      };

      // Extract info from website
      let extractedInfo: ExtractedInfo = {};
      if (websiteContent) {
        try {
          extractedInfo = await this.aiProvider.extractChurchInfo(context, websiteContent);
          enrichedFields.push('extracted_info');
        } catch (error) {
          console.warn(`Failed to extract info for ${church.name}:`, error);
        }
      }

      // Generate AI description
      let aiDescription: string | undefined;
      try {
        aiDescription = await this.aiProvider.generateDescription(context);
        enrichedFields.push('ai_description');
      } catch (error) {
        console.warn(`Failed to generate description for ${church.name}:`, error);
      }

      // Generate "what to expect"
      let aiWhatToExpect: string | undefined;
      try {
        aiWhatToExpect = await this.aiProvider.generateWhatToExpect(context);
        enrichedFields.push('ai_what_to_expect');
      } catch (error) {
        console.warn(`Failed to generate what to expect for ${church.name}:`, error);
      }

      // Update church record
      const updateData: ChurchUpdate = {
        updated_at: new Date().toISOString(),
        ai_generated_at: new Date().toISOString(),
      };

      if (aiDescription) {
        updateData.ai_description = aiDescription;
      }

      if (aiWhatToExpect) {
        updateData.ai_what_to_expect = aiWhatToExpect;
      }

      if (extractedInfo.denomination && !church.denomination) {
        updateData.denomination = extractedInfo.denomination;
        enrichedFields.push('denomination');
      }

      if (extractedInfo.worshipStyle && extractedInfo.worshipStyle.length > 0) {
        updateData.worship_style = extractedInfo.worshipStyle;
        enrichedFields.push('worship_style');
      }

      if (extractedInfo.serviceTimes && extractedInfo.serviceTimes.length > 0) {
        updateData.service_times = extractedInfo.serviceTimes;
        enrichedFields.push('service_times');
      }

      if (extractedInfo.hasKidsMinistry !== undefined) {
        updateData.has_kids_ministry = extractedInfo.hasKidsMinistry;
        enrichedFields.push('has_kids_ministry');
      }

      if (extractedInfo.hasYouthGroup !== undefined) {
        updateData.has_youth_group = extractedInfo.hasYouthGroup;
        enrichedFields.push('has_youth_group');
      }

      if (extractedInfo.hasSmallGroups !== undefined) {
        updateData.has_small_groups = extractedInfo.hasSmallGroups;
        enrichedFields.push('has_small_groups');
      }

      // Save to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (this.supabase as any)
        .from('churches')
        .update(updateData)
        .eq('id', churchId);

      if (updateError) {
        throw updateError;
      }

      // Mark as completed in queue
      await this.updateQueueStatus(churchId, 'completed');

      return {
        success: true,
        churchId,
        enrichedFields,
      };
    } catch (error) {
      // Mark as failed in queue
      await this.updateQueueStatus(
        churchId,
        'failed',
        error instanceof Error ? error.message : String(error)
      );

      return {
        success: false,
        churchId,
        enrichedFields,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process the next batch of churches in the enrichment queue
   */
  async processQueue(batchSize: number = 10): Promise<EnrichmentResult[]> {
    // Get pending churches from queue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = this.supabase as any;
    const { data: queueItems, error } = await supabaseAny
      .from('enrichment_queue')
      .select('church_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize) as { data: { church_id: string }[] | null; error: Error | null };

    if (error || !queueItems || queueItems.length === 0) {
      return [];
    }

    // Mark as processing
    const churchIds = queueItems.map((item) => item.church_id);
    await supabaseAny
      .from('enrichment_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .in('church_id', churchIds);

    // Process each church
    const results: EnrichmentResult[] = [];
    for (const item of queueItems) {
      const result = await this.enrichChurch(item.church_id);
      results.push(result);

      // Small delay between processing to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = this.supabase as any;
    const statuses = ['pending', 'processing', 'completed', 'failed'] as const;
    const stats: Record<string, number> = {};

    for (const status of statuses) {
      const { count } = await supabaseAny
        .from('enrichment_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      stats[status] = count ?? 0;
    }

    return stats as {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
  }

  /**
   * Retry failed enrichments
   */
  async retryFailed(limit: number = 100): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = this.supabase as any;
    const { data } = await supabaseAny
      .from('enrichment_queue')
      .update({ status: 'pending', error: null })
      .eq('status', 'failed')
      .limit(limit)
      .select('church_id');

    return data?.length ?? 0;
  }

  /**
   * Fetch and parse website content
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const contactEmail = process.env.CONTACT_EMAIL || 'support@psalmlog.com';
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': `ChurchDirectory/1.0 (${contactEmail})`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Basic HTML to text conversion
      // In production, you'd want a proper HTML parser
      return this.htmlToText(html);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Limit length
      .slice(0, 50000);
  }

  /**
   * Update queue status
   */
  private async updateQueueStatus(
    churchId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.supabase as any)
      .from('enrichment_queue')
      .update({
        status,
        error: error ?? null,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
      })
      .eq('church_id', churchId);
  }
}

/**
 * OpenAI-based AI Provider implementation
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateDescription(church: ChurchContext): Promise<string> {
    const prompt = `Write a brief, welcoming 2-3 sentence description for a church directory listing.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 2000)}` : ''}

The description should be:
- Factual and based on available information
- Welcoming to potential visitors
- Written in third person
- 2-3 sentences maximum

Do not make up specific details that aren't provided. Focus on what makes this church a welcoming place of worship.`;

    return this.callOpenAI(prompt);
  }

  async generateWhatToExpect(church: ChurchContext): Promise<string> {
    const prompt = `Write a helpful "What to Expect" guide for first-time visitors to a church.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 2000)}` : ''}

Include sections for:
1. Dress code (what's typical)
2. Service format (general structure)
3. Tips for visitors (parking, where to go, etc.)

Keep it practical and welcoming. If specific details aren't available, provide general guidance typical for this type of church. Format with clear section headers.`;

    return this.callOpenAI(prompt);
  }

  async generateCombinedEnrichment(church: ChurchContext): Promise<CombinedEnrichment> {
    const prompt = `Generate content for a church directory listing. Return only valid JSON.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 3000)}` : ''}

Return JSON with exactly these two fields:
{
  "description": "A brief, welcoming 2-3 sentence description. Factual, third person, based on available info.",
  "whatToExpect": "A helpful guide for first-time visitors covering: dress code, service format, and tips. Keep practical and welcoming. Use \\n for line breaks between sections."
}`;

    const response = await this.callOpenAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return {
        description: parsed.description || '',
        whatToExpect: parsed.whatToExpect || '',
      };
    } catch {
      return { description: '', whatToExpect: '' };
    }
  }

  async extractChurchInfo(church: ChurchContext, websiteContent: string): Promise<ExtractedInfo> {
    const prompt = `Extract structured information from this church website content.

Church: ${church.name}
Website content:
${websiteContent.slice(0, 4000)}

Extract and return as JSON:
{
  "denomination": "string or null",
  "worshipStyle": ["array of styles like 'Contemporary', 'Traditional', 'Blended'"] or null,
  "serviceTimes": [{"day": "Sunday", "time": "9:00 AM", "name": "Early Service"}] or null,
  "hasKidsMinistry": boolean or null,
  "hasYouthGroup": boolean or null,
  "hasSmallGroups": boolean or null,
  "pastorName": "string or null",
  "yearFounded": number or null
}

Only include fields where information is clearly stated. Return null for uncertain fields.
Respond with only valid JSON, no explanation.`;

    const response = await this.callOpenAI(prompt);

    try {
      return JSON.parse(response);
    } catch {
      return {};
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? '';
  }
}

/**
 * Anthropic Claude-based AI Provider implementation
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateDescription(church: ChurchContext): Promise<string> {
    const prompt = `Write a brief, welcoming 2-3 sentence description for a church directory listing.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 2000)}` : ''}

The description should be factual, welcoming, written in third person, and 2-3 sentences maximum.`;

    return this.callAnthropic(prompt);
  }

  async generateWhatToExpect(church: ChurchContext): Promise<string> {
    const prompt = `Write a helpful "What to Expect" guide for first-time visitors to ${church.name} in ${church.city}, ${church.state}.

${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 2000)}` : ''}

Include: Dress code, Service format, and Tips for visitors. Keep it practical and welcoming.`;

    return this.callAnthropic(prompt);
  }

  async generateCombinedEnrichment(church: ChurchContext): Promise<CombinedEnrichment> {
    const prompt = `Generate content for a church directory listing. Return only valid JSON.

Church: ${church.name}
Location: ${church.city}, ${church.state}
${church.denomination ? `Denomination: ${church.denomination}` : ''}
${church.websiteContent ? `Website excerpt: ${church.websiteContent.slice(0, 3000)}` : ''}

Return JSON with exactly these two fields:
{
  "description": "A brief, welcoming 2-3 sentence description. Factual, third person, based on available info.",
  "whatToExpect": "A helpful guide for first-time visitors covering: dress code, service format, and tips. Keep practical and welcoming. Use \\n for line breaks between sections."
}`;

    const response = await this.callAnthropic(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || '',
          whatToExpect: parsed.whatToExpect || '',
        };
      }
    } catch {
      // Fall back to empty if parsing fails
    }
    return { description: '', whatToExpect: '' };
  }

  async extractChurchInfo(church: ChurchContext, websiteContent: string): Promise<ExtractedInfo> {
    const prompt = `Extract structured information from this church website. Return only valid JSON.

Church: ${church.name}
Content: ${websiteContent.slice(0, 4000)}

Return JSON with these fields (use null if not found):
{"denomination": "string", "worshipStyle": ["array"], "serviceTimes": [{"day": "string", "time": "string", "name": "string"}], "hasKidsMinistry": boolean, "hasYouthGroup": boolean, "hasSmallGroups": boolean}`;

    const response = await this.callAnthropic(prompt);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
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
}

/**
 * Create enrichment service from environment variables
 */
export function createEnrichmentServiceFromEnv(): ChurchEnrichmentService | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured for enrichment service');
    return null;
  }

  // Prefer Anthropic, fall back to OpenAI
  let aiProvider: AIProvider;

  if (process.env.ANTHROPIC_API_KEY) {
    aiProvider = new AnthropicProvider(
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL ?? 'claude-3-haiku-20240307'
    );
  } else if (process.env.OPENAI_API_KEY) {
    aiProvider = new OpenAIProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    );
  } else {
    console.warn('No AI provider configured for enrichment');
    return null;
  }

  return new ChurchEnrichmentService(supabaseUrl, supabaseServiceKey, aiProvider);
}

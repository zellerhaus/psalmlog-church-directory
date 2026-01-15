import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate the Supabase URL format
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Supabase URLs should end in .supabase.co (not .com)
    return parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

// Create a null-safe Supabase client that handles missing env vars during build
function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Database features will be disabled.');
    return null;
  }

  if (!isValidSupabaseUrl(supabaseUrl)) {
    console.warn(`Invalid Supabase URL: ${supabaseUrl}. Expected format: https://[project].supabase.co`);
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

// Helper to check if Supabase is available
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn(
        'Supabase env vars missing.' +
            'Copy apps/web/.env.example to apps/web/.env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
}

/** Supabase client; null when env vars are not set (avoids placeholder URL CORS errors). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null;

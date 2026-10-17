import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('https://') &&
  supabaseServiceKey && 
  supabaseServiceKey !== 'your-service-role-key'
);

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export const supabaseClient = (isSupabaseConfigured && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

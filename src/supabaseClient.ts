import { createClient } from '@supabase/supabase-js';

// TEMPORARY: Hardcoded values for debugging (REMOVE AFTER FIXING)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jyulgyuyacyqpzaalaky.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWxneXV5YWN5cXB6YWFsYWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTE1NTQsImV4cCI6MjA2OTkyNzU1NH0.JfM09mYWye7cO05KPUJhYkmcGGVqiQg85DNthNDjRlw';

console.log('🔍 [supabaseClient] Configuration:', {
  supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  fullUrl: supabaseUrl // DEBUG: Show full URL to verify in production
});

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('🔴 [supabaseClient] Supabase environment variables are missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
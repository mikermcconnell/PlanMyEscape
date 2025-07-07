import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpocwyganaklxnbwsqqi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwb2N0d3lnYW5ha2x4bmJ3c3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTI4OTIsImV4cCI6MjA2NzM4ODg5Mn0.ZvrKCqQRGTuDfaSQRnVSsoBgJj35HHC9-26KWD1pNDc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
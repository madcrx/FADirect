import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get these from https://app.supabase.com/project/_/settings/api
// TODO: Replace with your actual Supabase project credentials
const SUPABASE_URL = 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Validate credentials format
const isValidSupabaseUrl = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
const isValidSupabaseKey = SUPABASE_ANON_KEY.length > 100 && SUPABASE_ANON_KEY.startsWith('eyJ');

if (!isValidSupabaseUrl || !isValidSupabaseKey) {
  console.warn(
    '⚠️ Invalid Supabase credentials detected. ' +
    'Please update SUPABASE_URL and SUPABASE_ANON_KEY in src/config/supabase.ts. ' +
    'Get your credentials from: https://app.supabase.com/project/_/settings/api'
  );
}

// Create Supabase client with error handling
// Use a mock client if credentials are invalid to prevent crashes
let supabaseClient: SupabaseClient;

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'fadirect-mobile',
      },
    },
  });
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a minimal mock client to prevent app crashes
  // This allows the app to start even with invalid credentials
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      signIn: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as any;
}

export const supabase = supabaseClient;
export default supabase;

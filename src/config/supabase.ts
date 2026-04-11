import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get these from https://app.supabase.com/project/_/settings/api
// TODO: Replace with your actual Supabase project credentials
const SUPABASE_URL = 'https://wvxnwecxupvwappomajl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NARKWb_f4LTpMEBaiGZ1RA_I7fY424K';

// Validate credentials format
const isValidSupabaseUrl = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
const isValidSupabaseKey = SUPABASE_ANON_KEY.length > 100; // Real keys are very long

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

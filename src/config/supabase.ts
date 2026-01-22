import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get these from https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://wvxnwecxupvwappomajl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NARKWb_f4LTpMEBaiGZ1RA_I7fY424K';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

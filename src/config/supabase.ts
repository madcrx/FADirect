import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get these from https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://wvxnwecxupvwappomajl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NARKWb_f4LTpMEBaiGZ1RA_I7fY424K';

// Helper to deeply clone and unfreeze objects
const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepClone);

  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Custom fetch wrapper to avoid frozen object issues with React Native
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  // Create a new unfrozen options object
  const fetchOptions = {
    ...options,
    headers: options.headers ? { ...options.headers } : {},
  };

  const response = await fetch(url, fetchOptions);

  // Clone the response to avoid frozen objects
  const clonedResponse = response.clone();

  // Read the response body
  const text = await clonedResponse.text();

  // Parse and deep clone the JSON to ensure no frozen objects
  let body: any;
  try {
    const parsed = JSON.parse(text);
    body = deepClone(parsed);
  } catch {
    body = text;
  }

  // Create a new Response with unfrozen data
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});

export default supabase;

// SUPABASE DISABLED - Using custom REST API backend instead
// This file is kept for backwards compatibility but does not create a real client

import { SupabaseClient } from '@supabase/supabase-js';

console.log('⚠️ Supabase client disabled - using custom API backend');

// Export a mock client to prevent import errors
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: new Error('Supabase disabled') }),
    signIn: async () => ({ data: null, error: new Error('Supabase disabled') }),
    signOut: async () => ({ error: new Error('Supabase disabled') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
  }),
} as any as SupabaseClient;

export default supabase;

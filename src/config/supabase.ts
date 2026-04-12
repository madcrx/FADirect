// SUPABASE DISABLED - Using custom REST API backend instead
// All @supabase/supabase-js imports removed to prevent URL polyfill crash

console.log('⚠️ Supabase client disabled - using custom API backend');

// Export a mock client to prevent import errors in legacy service files
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOtp: async () => ({ data: null, error: new Error('Supabase disabled') }),
    verifyOtp: async () => ({ data: { user: null }, error: new Error('Supabase disabled') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase disabled') }),
  }),
} as any;

export default supabase;

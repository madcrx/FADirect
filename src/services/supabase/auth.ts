// SUPABASE AUTH DISABLED - Using custom REST API backend instead
// All @supabase/supabase-js imports removed to prevent URL polyfill crash

// Plain TypeScript types (no Supabase dependency)
export type SupabaseUser = {
  id: string;
  phone?: string;
  email?: string;
};

export type SupabaseSession = {
  access_token: string;
  user: SupabaseUser;
};

export interface ConfirmationResult {
  confirm: (code: string) => Promise<{ user: SupabaseUser }>;
}

export class SupabaseAuthService {
  static async signInWithPhoneNumber(_phoneNumber: string): Promise<ConfirmationResult> {
    throw new Error('SupabaseAuthService disabled - use AuthService with custom API');
  }

  static async signOut(): Promise<void> {
    throw new Error('SupabaseAuthService disabled - use AuthService with custom API');
  }

  static async getCurrentUser(): Promise<SupabaseUser | null> {
    return null;
  }

  static async getSession(): Promise<SupabaseSession | null> {
    return null;
  }

  static onAuthStateChanged(_callback: (user: SupabaseUser | null) => void): () => void {
    return () => {};
  }
}

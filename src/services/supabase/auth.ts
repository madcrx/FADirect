import { supabase } from '@config/supabase';
import { Session, User } from '@supabase/supabase-js';

/**
 * Supabase Authentication Service
 * Handles phone number authentication and user session management
 */

export type SupabaseUser = User;
export type SupabaseSession = Session;

export interface ConfirmationResult {
  confirm: (code: string) => Promise<{ user: SupabaseUser }>;
}

export class SupabaseAuthService {
  /**
   * Send verification code to phone number via OTP
   */
  static async signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        throw error;
      }

      // Return a confirmation object similar to Firebase
      return {
        confirm: async (code: string) => {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            phone: phoneNumber,
            token: code,
            type: 'sms',
          });

          if (verifyError) {
            throw verifyError;
          }
          if (!data.user) {
            throw new Error('No user returned after verification');
          }

          return { user: data.user };
        },
      };
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<SupabaseSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: SupabaseUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }
}

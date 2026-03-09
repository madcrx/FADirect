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
   * Helper to safely extract error message from potentially frozen error objects
   */
  private static getErrorMessage(error: any): string {
    try {
      return error?.message || error?.error_description || error?.msg || 'An error occurred';
    } catch {
      return 'An error occurred';
    }
  }

  /**
   * Send verification code to phone number via OTP
   */
  static async signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        // Create a new error with the message from the frozen error object
        const errorMessage = this.getErrorMessage(error);
        throw new Error(errorMessage);
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
            // Create a new error with the message from the frozen error object
            const errorMessage = SupabaseAuthService.getErrorMessage(verifyError);
            throw new Error(errorMessage);
          }
          if (!data.user) {
            throw new Error('No user returned after verification');
          }

          return { user: data.user };
        },
      };
    } catch (error: any) {
      // Safely extract error message without modifying frozen objects
      const errorMessage = this.getErrorMessage(error);
      throw new Error(errorMessage || 'Failed to send verification code');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const errorMessage = this.getErrorMessage(error);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      throw new Error(errorMessage || 'Failed to sign out');
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
      // Safely log error without modifying frozen objects
      const errorMessage = this.getErrorMessage(error);
      console.error('Error getting current user:', errorMessage);
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
      // Safely log error without modifying frozen objects
      const errorMessage = this.getErrorMessage(error);
      console.error('Error getting session:', errorMessage);
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

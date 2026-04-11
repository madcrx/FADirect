import { SupabaseAuthService, ConfirmationResult, SupabaseUser } from '@services/supabase/auth';
import { database, COLLECTIONS, getTimestamp } from '@services/supabase/database';
import { User, UserRole } from '@types/index';
import { generateUserKeys } from '@services/encryption/signalProtocol';

/**
 * Authentication Service
 * Handles phone number authentication and user management
 */

export class AuthService {
  /**
   * Send verification code to phone number
   */
  static async sendVerificationCode(
    phoneNumber: string,
  ): Promise<ConfirmationResult> {
    try {
      const confirmation = await SupabaseAuthService.signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  }

  /**
   * Verify the code and sign in
   */
  static async verifyCode(
    confirmation: ConfirmationResult,
    code: string,
  ): Promise<{ user: SupabaseUser }> {
    try {
      const userCredential = await confirmation.confirm(code);
      return userCredential;
    } catch (error: any) {
      console.error('Error verifying code:', error);
      throw new Error(error.message || 'Invalid verification code');
    }
  }

  /**
   * Create a new user profile
   */
  static async createUserProfile(
    uid: string,
    phoneNumber: string,
    data: {
      firstName: string;
      lastName: string;
      role: UserRole;
      email?: string;
      organizationId?: string;
      organizationName?: string;
    },
  ): Promise<User> {
    try {
      const now = new Date();
      const user: User = {
        id: uid,
        phoneNumber,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        createdAt: now,
        lastSeen: now,
      };

      // Generate encryption keys for this user
      await generateUserKeys(uid);

      // Save user profile to Supabase
      await database.collection(COLLECTIONS.USERS).doc(uid).set({
        ...user,
        createdAt: getTimestamp(),
        lastSeen: getTimestamp(),
      });

      return user;
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      throw new Error(error.message || 'Failed to create user profile');
    }
  }

  /**
   * Get user profile from Supabase
   */
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const doc = await database.collection(COLLECTIONS.USERS).doc(uid).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined,
      } as User;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      await database
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .update({
          ...updates,
          lastSeen: getTimestamp(),
        });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  /**
   * Update last seen timestamp
   */
  static async updateLastSeen(uid: string): Promise<void> {
    try {
      await database.collection(COLLECTIONS.USERS).doc(uid).update({
        lastSeen: getTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await SupabaseAuthService.signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: SupabaseUser | null) => void) {
    return SupabaseAuthService.onAuthStateChanged(callback);
  }

  /**
   * Check if user profile exists
   */
  static async userProfileExists(uid: string): Promise<boolean> {
    try {
      const doc = await database.collection(COLLECTIONS.USERS).doc(uid).get();
      return doc.exists;
    } catch (error) {
      console.error('Error checking user profile:', error);
      return false;
    }
  }
}

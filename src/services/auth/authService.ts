import { AmplifyAuthService, ConfirmationResult, AmplifyUser } from '@services/amplify/auth';
import { database, COLLECTIONS, getTimestamp } from '@services/amplify/database';
import { User, UserRole } from '@types/index';
import { generateUserKeys } from '@services/encryption/signalProtocol';

/**
 * Authentication Service
 * Handles phone number authentication and user management
 */

export class AuthService {
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
   * Send verification code to phone number
   */
  static async sendVerificationCode(
    phoneNumber: string,
  ): Promise<ConfirmationResult> {
    try {
      const confirmation = await AmplifyAuthService.signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error sending verification code:', errorMessage);
      throw new Error(errorMessage || 'Failed to send verification code');
    }
  }

  /**
   * Verify the code and sign in
   */
  static async verifyCode(
    confirmation: ConfirmationResult,
    code: string,
  ): Promise<{ user: AmplifyUser }> {
    try {
      const userCredential = await confirmation.confirm(code);
      return userCredential;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error verifying code:', errorMessage);
      throw new Error(errorMessage || 'Invalid verification code');
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
      const errorMessage = this.getErrorMessage(error);
      console.error('Error creating user profile:', errorMessage);
      throw new Error(errorMessage || 'Failed to create user profile');
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
      const errorMessage = this.getErrorMessage(error);
      console.error('Error getting user profile:', errorMessage);
      throw new Error(errorMessage || 'Failed to get user profile');
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
      const errorMessage = this.getErrorMessage(error);
      console.error('Error updating user profile:', errorMessage);
      throw new Error(errorMessage || 'Failed to update user profile');
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
      const errorMessage = this.getErrorMessage(error);
      console.error('Error updating last seen:', errorMessage);
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await AmplifyAuthService.signOut();
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error signing out:', errorMessage);
      throw new Error(errorMessage || 'Failed to sign out');
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: SupabaseUser | null) => void) {
    return AmplifyAuthService.onAuthStateChanged(callback);
  }

  /**
   * Check if user profile exists
   */
  static async userProfileExists(uid: string): Promise<boolean> {
    try {
      const doc = await database.collection(COLLECTIONS.USERS).doc(uid).get();
      return doc.exists;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error checking user profile:', errorMessage);
      return false;
    }
  }
}

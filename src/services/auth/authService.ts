import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, apiClient, User as ApiUser } from '@services/api';
import { User, UserRole } from '@types/index';

const CURRENT_USER_KEY = '@fadirect_current_user';

/**
 * Authentication Service
 * Handles phone number authentication and user management
 */

export class AuthService {
  private static currentUser: User | null = null;

  /**
   * Initialize auth service - call this on app startup
   */
  static async initialize(): Promise<void> {
    try {
      await apiClient.initialize();

      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  /**
   * Send verification code to phone number
   */
  static async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      await authApi.sendVerificationCode(phoneNumber);
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  }

  /**
   * Verify the code and sign in
   */
  static async verifyCode(
    phoneNumber: string,
    code: string,
    name?: string
  ): Promise<{ user: User }> {
    try {
      const response = await authApi.verifyCode(phoneNumber, code, name);

      // Convert API user to app user format
      const user = this.convertApiUserToUser(response.user);

      // TODO: Re-enable encryption once migrated to custom API
      // Generate encryption keys for this user
      // await generateUserKeys(user.id);

      // Save current user
      this.currentUser = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      return { user };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      throw new Error(error.message || 'Invalid verification code');
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const response = await authApi.getCurrentUser();
      const user = this.convertApiUserToUser(response.user);

      this.currentUser = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      return user;
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await authApi.logout();

      this.currentUser = null;
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return apiClient.getAuthToken() !== null;
  }

  /**
   * Get cached user (doesn't make API call)
   */
  static getCachedUser(): User | null {
    return this.currentUser;
  }

  /**
   * Convert API user format to app user format
   */
  private static convertApiUserToUser(apiUser: ApiUser): User {
    const nameParts = (apiUser.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: apiUser.id,
      phoneNumber: apiUser.phoneNumber,
      role: apiUser.role as UserRole,
      firstName,
      lastName,
      createdAt: new Date(apiUser.createdAt),
      lastSeen: new Date(apiUser.lastSeen),
      profilePhotoUrl: apiUser.profilePhotoUrl,
    };
  }
}

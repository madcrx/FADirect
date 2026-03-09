import { signIn, signUp, confirmSignIn, confirmSignUp, signOut as amplifySignOut, getCurrentUser as amplifyGetCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

/**
 * AWS Amplify Authentication Service
 * Handles phone number authentication and user session management
 */

export interface AmplifyUser {
  userId: string;
  username: string;
}

export interface ConfirmationResult {
  confirm: (code: string) => Promise<{ user: AmplifyUser }>;
}

export class AmplifyAuthService {
  /**
   * Send verification code to phone number via SMS
   */
  static async signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      // Try to sign in first
      let nextStep;
      try {
        const signInResult = await signIn({
          username: formattedPhone,
          options: {
            authFlowType: 'CUSTOM_WITHOUT_SRP',
          },
        });
        nextStep = signInResult.nextStep;
      } catch (error: any) {
        // If user doesn't exist, sign them up
        if (error.name === 'UserNotFoundException') {
          const signUpResult = await signUp({
            username: formattedPhone,
            password: Math.random().toString(36).slice(-12), // Random password (not used)
            options: {
              userAttributes: {
                phone_number: formattedPhone,
              },
            },
          });
          nextStep = signUpResult.nextStep;
        } else {
          throw error;
        }
      }

      // Return a confirmation object
      return {
        confirm: async (code: string) => {
          try {
            if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
              await confirmSignIn({
                challengeResponse: code,
              });
            } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
              await confirmSignUp({
                username: formattedPhone,
                confirmationCode: code,
              });
              // Sign in after confirmation
              await signIn({
                username: formattedPhone,
                options: {
                  authFlowType: 'CUSTOM_WITHOUT_SRP',
                },
              });
            } else {
              throw new Error('Unexpected authentication step');
            }

            const currentUser = await amplifyGetCurrentUser();
            return {
              user: {
                userId: currentUser.userId,
                username: currentUser.username,
              },
            };
          } catch (error: any) {
            throw new Error(error.message || 'Invalid verification code');
          }
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send verification code');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await amplifySignOut();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(): Promise<AmplifyUser | null> {
    try {
      const user = await amplifyGetCurrentUser();
      return {
        userId: user.userId,
        username: user.username,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<any | null> {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Listen to auth state changes
   * Note: Amplify v6 uses Hub for auth events
   */
  static onAuthStateChanged(callback: (user: AmplifyUser | null) => void): () => void {
    // Import Hub from aws-amplify/utils
    const { Hub } = require('aws-amplify/utils');

    const listener = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          const user = await AmplifyAuthService.getCurrentUser();
          callback(user);
          break;
        case 'signedOut':
          callback(null);
          break;
      }
    });

    // Return unsubscribe function
    return () => {
      listener();
    };
  }
}

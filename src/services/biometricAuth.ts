import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_TYPE_KEY = '@biometric_type';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

class BiometricAuthService {
  /**
   * Check if device supports biometric authentication
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedTypes(): Promise<BiometricType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const supported: BiometricType[] = [];

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        supported.push('fingerprint');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        supported.push('face');
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        supported.push('iris');
      }

      return supported.length > 0 ? supported : ['none'];
    } catch (error) {
      console.error('Error getting supported biometric types:', error);
      return ['none'];
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(
    promptMessage: string = 'Authenticate to continue',
    cancelLabel: string = 'Cancel'
  ): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Check if biometric auth is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometric(): Promise<boolean> {
    try {
      // First check if biometrics are available
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Test authentication
      const authenticated = await this.authenticate(
        'Enable biometric authentication',
        'Cancel'
      );

      if (!authenticated) {
        return false;
      }

      // Save enabled status
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

      // Save biometric type
      const types = await this.getSupportedTypes();
      if (types.length > 0) {
        await AsyncStorage.setItem(BIOMETRIC_TYPE_KEY, types[0]);
      }

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication for the app
   */
  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_TYPE_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  /**
   * Get current biometric type being used
   */
  async getCurrentBiometricType(): Promise<BiometricType> {
    try {
      const type = await AsyncStorage.getItem(BIOMETRIC_TYPE_KEY);
      return (type as BiometricType) || 'none';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'none';
    }
  }

  /**
   * Get friendly name for biometric type
   */
  getBiometricTypeName(type: BiometricType): string {
    switch (type) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'face':
        return 'Face Recognition';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }
}

export const biometricAuthService = new BiometricAuthService();

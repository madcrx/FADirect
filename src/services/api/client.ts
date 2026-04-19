import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import logger from '../../utils/logger';

// API Configuration - HTTPS URLs (self-signed certificate for development)
// Backend must be running with HTTPS (see backend-setup/HTTPS-SETUP.md)
const API_BASE_URL = Platform.select({
  android: 'http://192.168.101.128:3000/api',  // HTTP required for Android
  ios: 'http://192.168.101.128:3000/api',      // HTTP for consistency
  default: 'http://localhost:3000/api',
});

logger.info(`Platform: ${Platform.OS}, API URL: ${API_BASE_URL}`);

const TOKEN_KEY = '@fadirect_auth_token';

// Configure axios defaults for React Native
axios.defaults.timeout = 10000;  // 10 second timeout
axios.defaults.maxRedirects = 0;  // No redirects

interface ApiErrorDetails {
  message?: string;
  details?: Record<string, unknown>[];
}

interface ApiError {
  message: string;
  status?: number;
  errors?: ApiErrorDetails;
}

class ApiClient {
  private authToken: string | null = null;

  async initialize() {
    try {
      this.authToken = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      logger.error('Failed to load auth token:', error);
    }
  }

  async setAuthToken(token: string | null) {
    this.authToken = token;
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      logger.error('Failed to save auth token:', error);
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      logger.api.request(options.method || 'GET', url, options.data);

      // Create a fresh axios instance for each request to avoid XHR reuse issues
      const response = await axios.create()({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers,
        timeout: 10000,
      });

      logger.api.response(options.method || 'GET', url, response.status);
      return response.data as T;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.api.error(options.method || 'GET', url, error);

        if (axiosError.response) {
          // Server responded with error
          const errorData = axiosError.response.data as Record<string, unknown>;
          const errorInfo = errorData?.error as ApiErrorDetails | undefined;
          throw {
            message: errorInfo?.message || 'An error occurred',
            status: axiosError.response.status,
            errors: errorInfo,
          } as ApiError;
        } else if (axiosError.request) {
          // Request made but no response
          throw {
            message: `Network Error: ${axiosError.code || 'UNKNOWN'} - ${axiosError.message}`,
            status: 0,
          } as ApiError;
        }
      }

      logger.error('Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      throw {
        message: errorMessage,
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      data,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      data,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();

    // FormData in React Native accepts file objects with uri/name/type
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await axios({
        url,
        method: 'POST',
        data: formData,
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data as T;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const errorData = axiosError.response.data as Record<string, unknown>;
          const errorInfo = errorData?.error as ApiErrorDetails | undefined;
          throw {
            message: errorInfo?.message || 'Upload failed',
            status: axiosError.response.status,
            errors: errorInfo,
          } as ApiError;
        } else {
          throw {
            message: 'Unable to connect to server. Please check your internet connection.',
            status: 0,
          } as ApiError;
        }
      }
      throw error;
    }
  }

  /**
   * Network diagnostics - test connectivity to backend
   * Call this on app startup to diagnose network issues
   */
  async runNetworkDiagnostics(): Promise<void> {
    console.log('🔧 ===== NETWORK DIAGNOSTICS START =====');
    console.log('📍 Target URL:', API_BASE_URL);
    console.log('📍 Test endpoint:', `${API_BASE_URL}/health`.replace('/api/health', '/health'));

    // Test 1: Simple GET to health endpoint
    try {
      console.log('🧪 Test 1: Fetching /health endpoint...');
      const healthUrl = API_BASE_URL.replace('/api', '') + '/health';

      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      });

      console.log('✅ Test 1 PASSED');
      console.log('  - Status:', response.status);
      console.log('  - Data:', JSON.stringify(response.data));
    } catch (error: unknown) {
      console.error('❌ Test 1 FAILED');
      if (axios.isAxiosError(error)) {
        console.error('  - Error:', error.message);
        console.error('  - Code:', error.code);
        console.error('  - Is network error:', !error.response);
      } else {
        console.error('  - Error:', error);
      }
    }

    // Test 2: POST to a likely endpoint
    try {
      console.log('🧪 Test 2: Testing POST request...');
      const testUrl = `${API_BASE_URL}/auth/send-code`;

      const response = await axios.post(testUrl,
        { phoneNumber: '+1234567890' },
        {
          timeout: 5000,
          validateStatus: () => true,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Test 2 PASSED (request reached server)');
      console.log('  - Status:', response.status);
      console.log('  - Response:', JSON.stringify(response.data).substring(0, 200));
    } catch (error: unknown) {
      console.error('❌ Test 2 FAILED');
      if (axios.isAxiosError(error)) {
        console.error('  - Error:', error.message);
        console.error('  - Code:', error.code);

        if (error.code === 'ERR_CLEARTEXT_NOT_PERMITTED') {
          console.error('  ⚠️  DIAGNOSIS: Android is blocking HTTP cleartext traffic!');
          console.error('  ⚠️  network_security_config.xml is not being applied');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('  ⚠️  DIAGNOSIS: Connection refused - backend not running or wrong port');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          console.error('  ⚠️  DIAGNOSIS: Timeout - network routing issue or firewall');
        } else if (error.message?.includes('Network Error')) {
          console.error('  ⚠️  DIAGNOSIS: Generic network error - likely cleartext or routing issue');
        }
      } else {
        console.error('  - Error:', error);
      }
    }

    console.log('🔧 ===== NETWORK DIAGNOSTICS END =====');
  }
}

export const apiClient = new ApiClient();
export type { ApiError };

interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  role?: string[];
  profilePhotoUrl?: string;
  organizationId?: string;
}

// Helper to find or create user by phone
export const findOrCreateUser = async (phoneNumber: string, name?: string, role?: string) => {
  return apiClient.post<{ user: User }>('/users/find-or-create', { phoneNumber, name, role });
};

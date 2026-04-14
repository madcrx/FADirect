import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// API Configuration - HTTPS URLs (self-signed certificate for development)
// Backend must be running with HTTPS (see backend-setup/HTTPS-SETUP.md)
const API_BASE_URL = Platform.select({
  android: 'http://192.168.101.128:3000/api',  // HTTP required for Android
  ios: 'http://192.168.101.128:3000/api',      // HTTP for consistency
  default: 'http://localhost:3000/api',
});

console.log(`📱 Platform: ${Platform.OS}, API URL: ${API_BASE_URL}`);

const TOKEN_KEY = '@fadirect_auth_token';

// Configure axios defaults for React Native
axios.defaults.timeout = 10000;  // 10 second timeout
axios.defaults.maxRedirects = 0;  // No redirects

interface ApiError {
  message: string;
  status?: number;
  errors?: any;
}

class ApiClient {
  private authToken: string | null = null;

  async initialize() {
    try {
      this.authToken = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to load auth token:', error);
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
      console.error('Failed to save auth token:', error);
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
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
      console.log('🌐 Making request:', options.method || 'GET', url);
      console.log('📝 Request headers:', JSON.stringify(headers));
      console.log('📦 Request data:', options.data ? JSON.stringify(options.data) : 'none');

      // Create a fresh axios instance for each request to avoid XHR reuse issues
      const response = await axios.create()({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers,
        timeout: 10000,
      });

      console.log('✅ Response received:', response.status);
      return response.data as T;
    } catch (error: any) {
      console.error('❌ Request failed:', error?.message);

      // COMPREHENSIVE ERROR DEBUGGING
      console.error('🔍 ERROR DEBUG INFO:');
      console.error('  - Error name:', error?.name);
      console.error('  - Error message:', error?.message);
      console.error('  - Error code:', error?.code);
      console.error('  - Error stack:', error?.stack?.substring(0, 200));

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('  - Is Axios Error: YES');
        console.error('  - Response exists:', !!axiosError.response);
        console.error('  - Request exists:', !!axiosError.request);
        console.error('  - Config URL:', axiosError.config?.url);
        console.error('  - Config method:', axiosError.config?.method);
        console.error('  - Config timeout:', axiosError.config?.timeout);

        if (axiosError.response) {
          // Server responded with error
          console.error('  - Response status:', axiosError.response.status);
          console.error('  - Response headers:', JSON.stringify(axiosError.response.headers));
          console.error('  - Response data:', JSON.stringify(axiosError.response.data));

          const errorData = axiosError.response.data as any;
          throw {
            message: errorData?.error?.message || 'An error occurred',
            status: axiosError.response.status,
            errors: errorData?.error,
          } as ApiError;
        } else if (axiosError.request) {
          // Request made but no response
          console.error('  - Request object type:', typeof axiosError.request);
          console.error('  - Request readyState:', (axiosError.request as any)?.readyState);
          console.error('  - Request status:', (axiosError.request as any)?.status);
          console.error('  - Request responseURL:', (axiosError.request as any)?.responseURL);
          console.error('  - Request statusText:', (axiosError.request as any)?.statusText);

          throw {
            message: `Network Error: ${error?.code || 'UNKNOWN'} - ${error?.message}`,
            status: 0,
          } as ApiError;
        }
      } else {
        console.error('  - Is Axios Error: NO');
        console.error('  - Raw error type:', typeof error);
        console.error('  - Raw error:', JSON.stringify(error, null, 2));
      }

      throw {
        message: error?.message || 'An unexpected error occurred',
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      data,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
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

    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

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
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const errorData = axiosError.response.data as any;
          throw {
            message: errorData?.error?.message || 'Upload failed',
            status: axiosError.response.status,
            errors: errorData?.error,
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
    } catch (error: any) {
      console.error('❌ Test 1 FAILED');
      console.error('  - Error:', error?.message);
      console.error('  - Code:', error?.code);
      console.error('  - Is network error:', !error?.response);
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
    } catch (error: any) {
      console.error('❌ Test 2 FAILED');
      console.error('  - Error:', error?.message);
      console.error('  - Code:', error?.code);

      if (error?.code === 'ERR_CLEARTEXT_NOT_PERMITTED') {
        console.error('  ⚠️  DIAGNOSIS: Android is blocking HTTP cleartext traffic!');
        console.error('  ⚠️  network_security_config.xml is not being applied');
      } else if (error?.code === 'ECONNREFUSED') {
        console.error('  ⚠️  DIAGNOSIS: Connection refused - backend not running or wrong port');
      } else if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') {
        console.error('  ⚠️  DIAGNOSIS: Timeout - network routing issue or firewall');
      } else if (error?.message?.includes('Network Error')) {
        console.error('  ⚠️  DIAGNOSIS: Generic network error - likely cleartext or routing issue');
      }
    }

    console.log('🔧 ===== NETWORK DIAGNOSTICS END =====');
  }
}

export const apiClient = new ApiClient();
export type { ApiError };

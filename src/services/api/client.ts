import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';

// API Configuration
// Android emulator uses 10.0.2.2 as special alias for host machine (via adb reverse)
// This requires: adb reverse tcp:3000 tcp:3000
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// TODO: When ready for production, use environment variables:
// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

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

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // Server responded with error
          const errorData = axiosError.response.data as any;
          throw {
            message: errorData?.error?.message || 'An error occurred',
            status: axiosError.response.status,
            errors: errorData?.error,
          } as ApiError;
        } else if (axiosError.request) {
          // Request made but no response
          throw {
            message: 'Unable to connect to server. Please check your internet connection.',
            status: 0,
          } as ApiError;
        }
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
}

export const apiClient = new ApiClient();
export type { ApiError };

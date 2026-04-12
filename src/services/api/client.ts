import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production - update this

const TOKEN_KEY = '@fadirect_auth_token';

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
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          message: data.error?.message || 'An error occurred',
          status: response.status,
          errors: data.error,
        };
        throw error;
      }

      return data as T;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw {
          message: 'Unable to connect to server. Please check your internet connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
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

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          message: data.error?.message || 'Upload failed',
          status: response.status,
          errors: data.error,
        };
        throw error;
      }

      return data as T;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw {
          message: 'Unable to connect to server. Please check your internet connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export type { ApiError };

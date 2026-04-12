import { apiClient } from './client';

export interface User {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: 'mourner' | 'arranger' | 'admin';
  profilePhotoUrl: string | null;
  createdAt: string;
  lastSeen: string;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponse {
  user: User;
  token: string;
}

export interface CurrentUserResponse {
  user: User;
}

export interface LogoutResponse {
  success: boolean;
}

export const authApi = {
  async sendVerificationCode(phoneNumber: string): Promise<SendCodeResponse> {
    return apiClient.post<SendCodeResponse>('/auth/send-code', {
      phoneNumber,
    });
  },

  async verifyCode(phoneNumber: string, code: string, name?: string): Promise<VerifyCodeResponse> {
    const response = await apiClient.post<VerifyCodeResponse>('/auth/verify-code', {
      phoneNumber,
      code,
      name,
    });

    // Save the token
    if (response.token) {
      await apiClient.setAuthToken(response.token);
    }

    return response;
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    return apiClient.get<CurrentUserResponse>('/auth/me');
  },

  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/auth/logout');

    // Clear the token
    await apiClient.setAuthToken(null);

    return response;
  },
};

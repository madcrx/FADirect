import { apiClient } from './client';
import { User } from './auth';

export interface UserProfile {
  user: {
    id: string;
    name: string;
    role: string;
    profilePhotoUrl: string | null;
  };
}

export interface UpdateProfileData {
  name?: string;
  profilePhotoUrl?: string;
}

export interface UpdateProfileResponse {
  user: User;
}

export const usersApi = {
  async getUserProfile(userId: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`/users/${userId}`);
  },

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    return apiClient.put<UpdateProfileResponse>('/users/me', data);
  },
};

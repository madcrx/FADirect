import { apiClient } from './client';

export interface Photo {
  id: string;
  arrangementId: string;
  uploadedBy: string;
  uploaderName?: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: string;
}

export interface PhotosListResponse {
  photos: Photo[];
}

export interface UploadPhotoResponse {
  photo: Photo;
}

export const photosApi = {
  async getPhotos(arrangementId: string): Promise<PhotosListResponse> {
    return apiClient.get<PhotosListResponse>(`/photos/arrangement/${arrangementId}`);
  },

  async uploadPhoto(
    fileUri: string,
    fileName: string,
    fileType: string,
    arrangementId: string,
    caption?: string
  ): Promise<UploadPhotoResponse> {
    return apiClient.uploadFile<UploadPhotoResponse>(
      '/photos/upload',
      fileUri,
      fileName,
      fileType,
      {
        arrangementId,
        ...(caption && { caption }),
      }
    );
  },

  async deletePhoto(photoId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/photos/${photoId}`);
  },
};

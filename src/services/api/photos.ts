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
    const response = await apiClient.get<any>(`/photos/arrangement/${arrangementId}`);

    // Map snake_case from backend to camelCase for frontend
    const photos = response.photos.map((photo: any) => ({
      id: photo.id,
      arrangementId: photo.arrangement_id,
      uploadedBy: photo.uploaded_by,
      uploaderName: photo.uploader_name,
      fileName: photo.file_name,
      fileUrl: photo.file_url,
      thumbnailUrl: photo.thumbnail_url,
      caption: photo.caption,
      createdAt: photo.created_at,
    }));

    return { photos };
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

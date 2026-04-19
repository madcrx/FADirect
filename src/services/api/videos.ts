import { apiClient } from './client';

export interface Video {
  id: string;
  arrangementId: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  caption?: string;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
}

export interface VideosListResponse {
  videos: Video[];
}

export interface UploadVideoResponse {
  message: string;
  video: Video;
}

export const videosApi = {
  getByArrangement: async (arrangementId: string): Promise<Video[]> => {
    const response = await apiClient.get<VideosListResponse>(`/videos/arrangement/${arrangementId}`);
    return response.data.videos;
  },

  uploadVideo: async (arrangementId: string, file: File | Blob, caption?: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('arrangementId', arrangementId);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await apiClient.post<UploadVideoResponse>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.video;
  },

  deleteVideo: async (videoId: string): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}`);
  },

  updateCaption: async (videoId: string, caption: string): Promise<void> => {
    await apiClient.put(`/videos/${videoId}`, { caption });
  },
};

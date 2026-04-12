import { apiClient } from './client';

export interface Document {
  id: string;
  arrangementId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string | null;
  createdAt: string;
}

export interface DocumentsListResponse {
  documents: Document[];
}

export interface UploadDocumentResponse {
  document: Document;
}

export const documentsApi = {
  async getDocuments(arrangementId: string): Promise<DocumentsListResponse> {
    return apiClient.get<DocumentsListResponse>(`/documents/arrangement/${arrangementId}`);
  },

  async uploadDocument(
    fileUri: string,
    fileName: string,
    fileType: string,
    arrangementId: string,
    documentType?: string
  ): Promise<UploadDocumentResponse> {
    return apiClient.uploadFile<UploadDocumentResponse>(
      '/documents/upload',
      fileUri,
      fileName,
      fileType,
      {
        arrangementId,
        ...(documentType && { documentType }),
      }
    );
  },
};

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
    const response = await apiClient.get<any>(`/documents/arrangement/${arrangementId}`);

    // Map snake_case from backend to camelCase for frontend
    const documents = response.documents.map((doc: any) => ({
      id: doc.id,
      arrangementId: doc.arrangement_id,
      uploadedBy: doc.uploaded_by,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      fileUrl: doc.file_url,
      documentType: doc.document_type,
      createdAt: doc.created_at,
    }));

    return { documents };
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

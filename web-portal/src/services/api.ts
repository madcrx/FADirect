import axios from 'axios';
import type { User, Arrangement, DashboardStats, Message, Document, Photo, PriceList, Invoice, StaffProfile, Leave } from '@/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (phoneNumber: string, code: string) => {
    const response = await api.post('/auth/verify-code', { phoneNumber, code });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
};

// Arrangements API
export const arrangementsApi = {
  getAll: async (): Promise<Arrangement[]> => {
    const response = await api.get('/arrangements');
    return response.data.arrangements;
  },

  getById: async (id: string): Promise<Arrangement> => {
    const response = await api.get(`/arrangements/${id}`);
    return response.data.arrangement;
  },

  create: async (data: Partial<Arrangement>): Promise<Arrangement> => {
    const response = await api.post('/arrangements', data);
    return response.data.arrangement;
  },

  update: async (id: string, data: Partial<Arrangement>): Promise<Arrangement> => {
    const response = await api.put(`/arrangements/${id}`, data);
    return response.data.arrangement;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/arrangements/${id}`);
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.users;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },

  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data.user;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data.user;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

// Messages API
export const messagesApi = {
  getByArrangement: async (arrangementId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/arrangement/${arrangementId}`);
    return response.data.messages;
  },
  sendMessage: async (data: {
    recipientId: string;
    arrangementId: string;
    encryptedContent: string;
    messageType?: string;
  }): Promise<Message> => {
    const response = await api.post('/messages', data);
    return response.data.message;
  },
  markAsRead: async (messageId: string): Promise<void> => {
    await api.put(`/messages/${messageId}/read`);
  },
};

// Documents API
export const documentsApi = {
  getByArrangement: async (arrangementId: string): Promise<Document[]> => {
    const response = await api.get(`/documents/arrangement/${arrangementId}`);
    return response.data.documents;
  },
};

// Photos API
export const photosApi = {
  getByArrangement: async (arrangementId: string): Promise<Photo[]> => {
    const response = await api.get(`/photos/arrangement/${arrangementId}`);
    return response.data.photos;
  },
};

export const videosApi = {
  getByArrangement: async (arrangementId: string): Promise<any[]> => {
    const response = await api.get(`/videos/arrangement/${arrangementId}`);
    return response.data.videos;
  },
};

// Invoice API
export const invoiceApi = {
  getStats: async (): Promise<any> => {
    const response = await api.get('/invoices/stats');
    return response.data;
  },
  getAnalytics: async (): Promise<any> => {
    const response = await api.get('/invoices/analytics');
    return response.data;
  },
};

// Leave API
export const leaveApi = {
  getAllLeave: async (status?: string): Promise<Leave[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/staff-profiles/leave/all', { params });
    return response.data.leave;
  },
  getLeaveByStaff: async (staffId: string): Promise<Leave[]> => {
    const response = await api.get(`/staff-profiles/${staffId}/leave`);
    return response.data.leave;
  },
  createLeave: async (staffId: string, data: {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status?: string;
  }): Promise<Leave> => {
    const response = await api.post(`/staff-profiles/${staffId}/leave`, data);
    return response.data.leave;
  },
  updateLeaveStatus: async (staffId: string, leaveId: string, status: string): Promise<void> => {
    await api.put(`/staff-profiles/${staffId}/leave/${leaveId}`, { status });
  },
  deleteLeave: async (staffId: string, leaveId: string): Promise<void> => {
    await api.delete(`/staff-profiles/${staffId}/leave/${leaveId}`);
  },
};

// File Sends API
export const fileSendsApi = {
  send: async (data: {
    fileId: string;
    fileType: string;
    arrangementId: string;
    sentToUserId: string;
    notes?: string;
  }): Promise<any> => {
    const response = await api.post('/file-sends', data);
    return response.data;
  },
  getByArrangement: async (arrangementId: string): Promise<any[]> => {
    const response = await api.get(`/file-sends/arrangement/${arrangementId}`);
    return response.data.fileSends;
  },
  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.put(`/file-sends/${id}/status`, { status });
  },
  markAsViewed: async (id: string): Promise<void> => {
    await api.post(`/file-sends/${id}/viewed`);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/file-sends/${id}`);
  },
};

// Pre-Arrangement Forms API
export const preArrangementFormsApi = {
  send: async (arrangementId: string): Promise<any> => {
    const response = await api.post('/pre-arrangement-forms/send', { arrangementId });
    return response.data;
  },
  getByArrangement: async (arrangementId: string): Promise<any> => {
    const response = await api.get(`/pre-arrangement-forms/arrangement/${arrangementId}`);
    return response.data.form;
  },
  update: async (id: string, formData: any, status?: string): Promise<any> => {
    const response = await api.put(`/pre-arrangement-forms/${id}`, { formData, status });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/pre-arrangement-forms/${id}`);
  },
};

export default api;

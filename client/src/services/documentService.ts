import api from './api';
import type { Document } from '../types/document';

export const documentService = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('document', file);
    return api.post<{ document: Document }>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAll: () => api.get<{ documents: Document[] }>('/documents'),

  getOne: (id: string) => api.get<{ document: Document }>(`/documents/${id}`),

  delete: (id: string) => api.delete<{ message: string }>(`/documents/${id}`),
};

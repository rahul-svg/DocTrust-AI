import api from './api';
import type { Verification } from '../types/verification';

export const verificationService = {
  verify: (documentId: string) =>
    api.post<{ verification: Verification }>(`/documents/${documentId}/verify`),

  getAll: () => api.get<{ verifications: Verification[] }>('/verifications'),

  getOne: (id: string) =>
    api.get<{ verification: Verification }>(`/verifications/${id}`),
};

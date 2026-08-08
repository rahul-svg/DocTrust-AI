import api from './api';
import type { AuthResponse } from '../types/auth';

export const authService = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  getMe: () => api.get<{ user: AuthResponse['user'] }>('/auth/me'),
};

import { apiClient } from './client';

export const propertiesApi = {
  search: (params: Record<string, string | number>) =>
    apiClient.get('/search', { params }).then((r) => r.data),

  suggestions: (q: string) =>
    apiClient.get('/search/suggestions', { params: { q } }).then((r) => r.data),

  getById: (id: string, params?: Record<string, string>) =>
    apiClient.get(`/properties/${id}`, { params }).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/properties', data).then((r) => r.data),

  publish: (id: string) =>
    apiClient.post(`/properties/${id}/publish`).then((r) => r.data),
};

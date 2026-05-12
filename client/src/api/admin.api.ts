import { apiClient } from './client';

export const adminApi = {
  getStats: () =>
    apiClient.get('/admin/stats').then(r => r.data),

  getUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/users', { params }).then(r => r.data),

  getProperties: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/properties', { params }).then(r => r.data),

  getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get('/admin/bookings', { params }).then(r => r.data),

  updatePropertyStatus: (propertyId: string, status: string) =>
    apiClient.patch(`/admin/properties/${propertyId}/status`, { status }).then(r => r.data),
};

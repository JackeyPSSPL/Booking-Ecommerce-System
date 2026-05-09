import { apiClient } from './client';

export const partnerApi = {
  getSummary: () =>
    apiClient.get('/partner/summary').then(r => r.data),

  getProperties: () =>
    apiClient.get('/partner/properties').then(r => r.data),

  getUpcomingArrivals: () =>
    apiClient.get('/partner/arrivals').then(r => r.data),

  getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get('/partner/bookings', { params }).then(r => r.data),

  markNoShow: (bookingId: string) =>
    apiClient.patch(`/partner/bookings/${bookingId}/noshow`).then(r => r.data),

  getEarnings: () =>
    apiClient.get('/partner/earnings').then(r => r.data),

  getAvailability: (propertyId: string, year: number, month: number) =>
    apiClient.get(`/partner/properties/${propertyId}/availability`, { params: { year, month } }).then(r => r.data),

  updateAvailability: (propertyId: string, dates: { date: string; roomTypeId: string; isBlocked: boolean }[]) =>
    apiClient.patch(`/partner/properties/${propertyId}/availability`, { dates }).then(r => r.data),
};

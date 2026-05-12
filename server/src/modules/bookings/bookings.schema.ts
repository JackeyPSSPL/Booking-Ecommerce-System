import { z } from 'zod';

export const createHoldSchema = z
  .object({
    roomTypeId: z.string().uuid(),
    propertyId: z.string().uuid(),
    checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    adults: z.coerce.number().int().min(1).default(1),
    children: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => new Date(data.checkout) > new Date(data.checkin), {
    message: 'Checkout must be after checkin',
    path: ['checkout'],
  });

export const guestDetailsSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().min(5),
  country: z.string().min(2),
  specialRequests: z.string().max(500).optional(),
  arrivalTime: z.string().optional(),
});

export const paymentSchema = z.object({
  cardholderName: z.string().min(2),
  cardNumber: z.string().regex(/^\d{16}$/, 'Enter 16 digits'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvc: z.string().regex(/^\d{3}$/, '3-digit CVC required'),
  simulateFailure: z.boolean().optional(),
});

export const createBookingSchema = z.object({
  holdId: z.string().uuid(),
  ratePlanId: z.string().uuid().optional(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  guestDetails: guestDetailsSchema,
  payment: paymentSchema,
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateHoldDto = z.infer<typeof createHoldSchema>;
export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type ListBookingsQueryDto = z.infer<typeof listBookingsQuerySchema>;

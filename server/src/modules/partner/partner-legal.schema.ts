import { z } from 'zod';

export const upsertLegalSchema = z.object({
  entityType: z.enum(['INDIVIDUAL', 'BUSINESS']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format').optional(),
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional(),
  gst: z.string().max(15, 'GST number too long').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
});

export const declineBookingSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason (at least 5 characters)').max(500),
});

export type UpsertLegalDto = z.infer<typeof upsertLegalSchema>;
export type DeclineBookingDto = z.infer<typeof declineBookingSchema>;

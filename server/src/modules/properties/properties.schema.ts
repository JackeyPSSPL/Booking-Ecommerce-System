import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).optional(),
  address: z.string().min(5).trim(),
  city: z.string().min(2).trim(),
  postcode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.enum(['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER']),
  starRating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).default([]),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyDto = z.infer<typeof createPropertySchema>;
export type UpdatePropertyDto = z.infer<typeof updatePropertySchema>;

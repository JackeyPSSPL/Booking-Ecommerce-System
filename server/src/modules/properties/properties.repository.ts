import { Prisma, PropertyStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreatePropertyDto, UpdatePropertyDto } from './properties.schema';
import { PropertySearchResult } from '../search/search.repository';

export class PropertiesRepository {
  async create(ownerId: string, data: CreatePropertyDto) {
    return prisma.property.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
        lat: data.lat,
        lng: data.lng,
        category: data.category,
        starRating: data.starRating,
        amenities: data.amenities as Prisma.InputJsonValue,
        status: PropertyStatus.DRAFT,
      },
    });
  }

  async findById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        roomTypes: {
          include: { ratePlans: true },
          orderBy: { basePrice: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: UpdatePropertyDto) {
    const updateData: Prisma.PropertyUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postcode !== undefined) updateData.postcode = data.postcode;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.starRating !== undefined) updateData.starRating = data.starRating;
    if (data.amenities !== undefined) updateData.amenities = data.amenities as Prisma.InputJsonValue;
    return prisma.property.update({ where: { id }, data: updateData });
  }

  async publish(id: string) {
    return prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.ACTIVE },
    });
  }

  async getFeatured(): Promise<PropertySearchResult[]> {
    return prisma.$queryRaw<PropertySearchResult[]>(Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.city,
        p.address,
        p.category::text  AS category,
        p.status::text    AS status,
        p.star_rating,
        p.amenities,
        p.description,
        p.booking_mode::text AS booking_mode,
        (
          SELECT MIN(rt.base_price)::text
          FROM room_types rt
          WHERE rt.property_id = p.id
        ) AS min_price,
        (
          SELECT pi.url
          FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS cover_image
      FROM properties p
      WHERE p.status = 'ACTIVE'
      ORDER BY p.star_rating DESC NULLS LAST, p.name ASC
      LIMIT 8
    `);
  }
}

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { SearchQueryDto } from './search.schema';

export interface PropertySearchResult {
  id: string;
  name: string;
  city: string;
  address: string;
  category: string;
  status: string;
  star_rating: number | null;
  amenities: unknown;
  description: string | null;
  booking_mode: string;
  min_price: string | null;
  cover_image: string | null;
}

export class SearchRepository {
  async search(dto: SearchQueryDto): Promise<{ data: PropertySearchResult[]; total: number }> {
    const { destination, checkin, checkout, adults, category, page, limit } = dto;
    const offset = (page - 1) * limit;
    const destLike = `%${destination}%`;
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    const categoryFilter = category
      ? Prisma.sql`AND p.category::text = ${category}`
      : Prisma.empty;

    const availabilityFilter = Prisma.sql`
      AND EXISTS (
        SELECT 1 FROM room_types rt
        WHERE rt.property_id = p.id
        AND rt.max_occupancy >= ${adults}
        AND NOT EXISTS (
          SELECT 1 FROM availability a
          WHERE a.room_type_id = rt.id
          AND a.date >= ${checkinDate}::date
          AND a.date < ${checkoutDate}::date
          AND a.is_blocked = true
        )
      )
    `;

    const whereClause = Prisma.sql`
      WHERE p.status = 'ACTIVE'
      AND (
        p.city ILIKE ${destLike}
        OR p.name ILIKE ${destLike}
        OR p.search_vector @@ plainto_tsquery('english', ${destination})
      )
      ${categoryFilter}
      ${availabilityFilter}
    `;

    const [data, countRows] = await Promise.all([
      prisma.$queryRaw<PropertySearchResult[]>(Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.city,
          p.address,
          p.category::text AS category,
          p.status::text AS status,
          p.star_rating,
          p.amenities,
          p.description,
          p.booking_mode::text AS booking_mode,
          (
            SELECT MIN(rt2.base_price)::text
            FROM room_types rt2
            WHERE rt2.property_id = p.id
          ) AS min_price,
          (
            SELECT pi.url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC
            LIMIT 1
          ) AS cover_image
        FROM properties p
        ${whereClause}
        ORDER BY p.star_rating DESC NULLS LAST, p.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM properties p
        ${whereClause}
      `),
    ]);

    return { data, total: Number(countRows[0]?.count ?? 0) };
  }

  async suggestions(destination: string): Promise<string[]> {
    const destLike = `${destination}%`;
    const rows = await prisma.$queryRaw<[{ city: string }]>(Prisma.sql`
      SELECT DISTINCT city
      FROM properties
      WHERE status = 'ACTIVE' AND city ILIKE ${destLike}
      ORDER BY city ASC
      LIMIT 8
    `);
    return (rows as { city: string }[]).map((r) => r.city);
  }
}

import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError, ConflictError } from '../../common/errors/app-error';

const COMMISSION_RATE = 0.12;

export class PartnerRepository {
  private async propertyIds(ownerId: string): Promise<string[]> {
    const rows = await prisma.property.findMany({ where: { ownerId }, select: { id: true } });
    return rows.map(r => r.id);
  }

  async getProperties(ownerId: string) {
    return prisma.property.findMany({
      where: { ownerId },
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
        roomTypes: { select: { id: true, name: true, basePrice: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(ownerId: string) {
    const ids = await this.propertyIds(ownerId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const propFilter = ids.length ? { propertyId: { in: ids } } : { propertyId: 'none' };

    const [totalProperties, activeBookings, revenue, upcomingArrivals] = await Promise.all([
      prisma.property.count({ where: { ownerId } }),
      prisma.booking.count({ where: { ...propFilter, status: 'CONFIRMED', checkout: { gte: now } } }),
      prisma.booking.aggregate({
        where: { ...propFilter, status: { in: ['CONFIRMED', 'COMPLETED'] }, createdAt: { gte: startOfMonth } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({ where: { ...propFilter, status: 'CONFIRMED', checkin: { gte: now, lte: next7 } } }),
    ]);

    return {
      totalProperties,
      activeBookings,
      monthlyRevenue: Number(revenue._sum.totalPrice ?? 0),
      upcomingArrivals,
    };
  }

  async getUpcomingArrivals(ownerId: string) {
    const ids = await this.propertyIds(ownerId);
    if (!ids.length) return [];
    const now = new Date();
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return prisma.booking.findMany({
      where: { propertyId: { in: ids }, status: 'CONFIRMED', checkin: { gte: now, lte: next7 } },
      include: {
        property: { select: { id: true, name: true } },
        roomType: { select: { name: true } },
      },
      orderBy: { checkin: 'asc' },
    });
  }

  async getBookings(ownerId: string, status: string | undefined, page: number, limit: number) {
    const ids = await this.propertyIds(ownerId);
    const where: Prisma.BookingWhereInput = {
      ...(ids.length ? { propertyId: { in: ids } } : { propertyId: 'none' }),
      ...(status && status !== 'ALL' ? { status: status as BookingStatus } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, city: true } },
          roomType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markNoShow(bookingId: string, ownerId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
      include: { property: { select: { ownerId: true } } },
    });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.property.ownerId !== ownerId) throw new ForbiddenError('Access denied');
    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError('Only confirmed bookings can be marked no-show', 'INVALID_STATUS');
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: 'NO_SHOW' } });
  }

  async getEarnings(ownerId: string) {
    const ids = await this.propertyIds(ownerId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const propFilter = ids.length ? { propertyId: { in: ids } } : { propertyId: 'none' };
    const paidFilter = { status: { in: ['CONFIRMED', 'COMPLETED'] as BookingStatus[] } };

    const [thisMonth, lastMonth, lifetime, bookings] = await Promise.all([
      prisma.booking.aggregate({ where: { ...propFilter, ...paidFilter, createdAt: { gte: startOfMonth } }, _sum: { totalPrice: true } }),
      prisma.booking.aggregate({ where: { ...propFilter, ...paidFilter, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalPrice: true } }),
      prisma.booking.aggregate({ where: { ...propFilter, ...paidFilter }, _sum: { totalPrice: true } }),
      ids.length ? prisma.booking.findMany({
        where: { propertyId: { in: ids }, status: { in: ['CONFIRMED', 'COMPLETED', 'CANCELLED'] } },
        include: { property: { select: { name: true } }, roomType: { select: { name: true } } },
        orderBy: { checkout: 'desc' },
        take: 50,
      }) : [],
    ]);

    const n = (v: Prisma.Decimal | null | undefined) => Number(v ?? 0);

    return {
      summary: {
        thisMonth: n(thisMonth._sum.totalPrice),
        lastMonth: n(lastMonth._sum.totalPrice),
        lifetime: n(lifetime._sum.totalPrice),
        commissionRate: COMMISSION_RATE,
      },
      bookings: bookings.map(b => {
        const total = n(b.totalPrice);
        const commission = total * COMMISSION_RATE;
        return {
          id: b.id,
          confirmationNumber: b.confirmationNumber,
          checkoutDate: b.checkout,
          total,
          commission,
          payout: total - commission,
          status: b.status,
          property: b.property.name,
          roomType: b.roomType.name,
        };
      }),
    };
  }

  async getAvailabilityForMonth(propertyId: string, ownerId: string, year: number, month: number) {
    const prop = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
    if (!prop) throw new ForbiddenError('Property not found or access denied');
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return prisma.availability.findMany({
      where: { propertyId, date: { gte: start, lte: end } },
      include: { roomType: { select: { id: true, name: true } } },
    });
  }

  async updateAvailability(
    propertyId: string,
    ownerId: string,
    dates: { date: string; roomTypeId: string; isBlocked: boolean }[],
  ) {
    const prop = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
    if (!prop) throw new ForbiddenError('Property not found or access denied');

    for (const d of dates.filter(d => d.isBlocked)) {
      const existing = await prisma.availability.findFirst({
        where: { propertyId, roomTypeId: d.roomTypeId, date: new Date(d.date), bookingId: { not: null } },
      });
      if (existing) {
        throw new ConflictError(`Date ${d.date} has an active booking and cannot be blocked`, 'BOOKING_EXISTS_ON_DATE');
      }
    }

    await Promise.all(
      dates.map(d =>
        prisma.availability.upsert({
          where: { roomTypeId_date: { roomTypeId: d.roomTypeId, date: new Date(d.date) } },
          create: { propertyId, roomTypeId: d.roomTypeId, date: new Date(d.date), isBlocked: d.isBlocked },
          update: { isBlocked: d.isBlocked },
        }),
      ),
    );
  }
}

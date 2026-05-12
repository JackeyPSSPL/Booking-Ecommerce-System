import { BookingStatus, PropertyStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class AdminRepository {
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalProperties,
      activeProperties,
      totalBookings,
      confirmedBookings,
      revenueThisMonth,
      revenueLifetime,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.property.count({ where: { status: PropertyStatus.ACTIVE } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.aggregate({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true, city: true } },
          roomType: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalProperties,
      activeProperties,
      totalBookings,
      confirmedBookings,
      revenueThisMonth: Number(revenueThisMonth._sum.totalPrice ?? 0),
      revenueLifetime: Number(revenueLifetime._sum.totalPrice ?? 0),
      recentBookings,
    };
  }

  async getUsers(role: string | undefined, page: number, limit: number) {
    const where = role && role !== 'ALL' ? { role: role as Role } : {};
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProperties(status: string | undefined, page: number, limit: number) {
    const where = status && status !== 'ALL' ? { status: status as PropertyStatus } : {};
    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true, roomTypes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBookings(status: string | undefined, page: number, limit: number) {
    const where = status && status !== 'ALL' ? { status: status as BookingStatus } : {};
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, city: true } },
          roomType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updatePropertyStatus(propertyId: string, status: PropertyStatus) {
    return prisma.property.update({
      where: { id: propertyId },
      data: { status },
    });
  }
}

import { AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { PartnerRepository } from './partner.repository';

const repo = new PartnerRepository();

export class PartnerService {
  async getSummary(ownerId: string) {
    try { return await repo.getSummary(ownerId); }
    catch (e) { this.rethrow(e, 'SUMMARY_FAILED', 'Failed to load summary', { ownerId }); }
  }

  async getProperties(ownerId: string) {
    try { return await repo.getProperties(ownerId); }
    catch (e) { this.rethrow(e, 'PROPERTIES_FAILED', 'Failed to load properties', { ownerId }); }
  }

  async getUpcomingArrivals(ownerId: string) {
    try { return await repo.getUpcomingArrivals(ownerId); }
    catch (e) { this.rethrow(e, 'ARRIVALS_FAILED', 'Failed to load arrivals', { ownerId }); }
  }

  async getBookings(ownerId: string, status: string | undefined, page: number, limit: number) {
    try { return await repo.getBookings(ownerId, status, page, limit); }
    catch (e) { this.rethrow(e, 'BOOKINGS_FAILED', 'Failed to load bookings', { ownerId }); }
  }

  async markNoShow(bookingId: string, ownerId: string) {
    try {
      const booking = await repo.markNoShow(bookingId, ownerId);
      logger.info('Booking marked no-show', { bookingId, ownerId });
      return booking;
    } catch (e) { this.rethrow(e, 'NOSHOW_FAILED', 'Failed to update booking', { bookingId, ownerId }); }
  }

  async getEarnings(ownerId: string) {
    try { return await repo.getEarnings(ownerId); }
    catch (e) { this.rethrow(e, 'EARNINGS_FAILED', 'Failed to load earnings', { ownerId }); }
  }

  async getAvailability(propertyId: string, ownerId: string, year: number, month: number) {
    try { return await repo.getAvailabilityForMonth(propertyId, ownerId, year, month); }
    catch (e) { this.rethrow(e, 'AVAILABILITY_FAILED', 'Failed to load availability', { propertyId, ownerId }); }
  }

  async updateAvailability(
    propertyId: string,
    ownerId: string,
    dates: { date: string; roomTypeId: string; isBlocked: boolean }[],
  ) {
    try {
      await repo.updateAvailability(propertyId, ownerId, dates);
      logger.info('Availability updated', { propertyId, ownerId, count: dates.length });
    } catch (e) { this.rethrow(e, 'AVAILABILITY_UPDATE_FAILED', 'Failed to update availability', { propertyId, ownerId }); }
  }

  private rethrow(e: unknown, code: string, message: string, ctx: Record<string, unknown>): never {
    logger.error(message, { error: e, ...ctx });
    if (e instanceof AppError) throw e;
    throw new AppError(500, code, message);
  }
}

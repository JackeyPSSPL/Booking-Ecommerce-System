import { PropertyStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import { AdminRepository } from './admin.repository';

const repo = new AdminRepository();

export class AdminService {
  async getStats() {
    try { return await repo.getStats(); }
    catch (e) { this.rethrow(e, 'STATS_FAILED', 'Failed to load stats'); }
  }

  async getUsers(role: string | undefined, page: number, limit: number) {
    try { return await repo.getUsers(role, page, limit); }
    catch (e) { this.rethrow(e, 'USERS_FAILED', 'Failed to load users'); }
  }

  async getProperties(status: string | undefined, page: number, limit: number) {
    try { return await repo.getProperties(status, page, limit); }
    catch (e) { this.rethrow(e, 'PROPERTIES_FAILED', 'Failed to load properties'); }
  }

  async getBookings(status: string | undefined, page: number, limit: number) {
    try { return await repo.getBookings(status, page, limit); }
    catch (e) { this.rethrow(e, 'BOOKINGS_FAILED', 'Failed to load bookings'); }
  }

  async updatePropertyStatus(propertyId: string, status: string) {
    try {
      const prop = await repo.updatePropertyStatus(propertyId, status as PropertyStatus);
      logger.info('Property status updated by admin', { propertyId, status });
      return prop;
    } catch (e) { this.rethrow(e, 'STATUS_UPDATE_FAILED', 'Failed to update property status'); }
  }

  private rethrow(e: unknown, code: string, message: string): never {
    logger.error(message, { error: e });
    if (e instanceof AppError) throw e;
    throw new AppError(500, code, message);
  }
}

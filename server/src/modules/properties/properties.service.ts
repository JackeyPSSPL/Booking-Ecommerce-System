import { PropertiesRepository } from './properties.repository';
import { CreatePropertyDto, UpdatePropertyDto } from './properties.schema';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

export class PropertiesService {
  private readonly repo = new PropertiesRepository();

  async create(ownerId: string, dto: CreatePropertyDto) {
    try {
      const property = await this.repo.create(ownerId, dto);
      logger.info('Property created', { propertyId: property.id, ownerId });
      return property;
    } catch (error) {
      logger.error('Failed to create property', { error, ownerId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_CREATE_FAILED', 'Failed to create property');
    }
  }

  async getById(id: string) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    return property;
  }

  async update(id: string, userId: string, dto: UpdatePropertyDto) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const updated = await this.repo.update(id, dto);
      logger.info('Property updated', { propertyId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to update property', { error, propertyId: id });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_UPDATE_FAILED', 'Failed to update property');
    }
  }

  async publish(id: string, userId: string) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    if (property.status === 'ACTIVE') {
      throw new ConflictError('Property is already published', 'ALREADY_PUBLISHED');
    }
    try {
      const updated = await this.repo.publish(id);
      logger.info('Property published', { propertyId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to publish property', { error, propertyId: id });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_PUBLISH_FAILED', 'Failed to publish property');
    }
  }
}

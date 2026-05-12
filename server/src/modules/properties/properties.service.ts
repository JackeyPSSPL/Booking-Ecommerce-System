import { PropertiesRepository } from './properties.repository';
import { CreatePropertyDto, UpdatePropertyDto, AddRoomTypeDto, AddImagesDto } from './properties.schema';
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

  async addRoomType(propertyId: string, userId: string, dto: AddRoomTypeDto) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const roomType = await this.repo.addRoomType(propertyId, dto);
      logger.info('Room type added', { propertyId, roomTypeId: roomType.id, userId });
      return roomType;
    } catch (error) {
      logger.error('Failed to add room type', { error, propertyId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'ROOM_TYPE_CREATE_FAILED', 'Failed to add room type');
    }
  }

  async addImages(propertyId: string, userId: string, dto: AddImagesDto) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const result = await this.repo.addImages(propertyId, dto);
      logger.info('Images added', { propertyId, count: result.count, userId });
      return result;
    } catch (error) {
      logger.error('Failed to add images', { error, propertyId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'IMAGES_CREATE_FAILED', 'Failed to save images');
    }
  }

  async getFeatured() {
    try {
      return await this.repo.getFeatured();
    } catch (error) {
      logger.error('Failed to get featured properties', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'FEATURED_FAILED', 'Failed to load featured properties');
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

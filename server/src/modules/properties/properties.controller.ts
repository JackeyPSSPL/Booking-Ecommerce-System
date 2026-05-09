import { Request, Response, NextFunction } from 'express';
import { PropertiesService } from './properties.service';
import { ok, created } from '../../common/utils/response';

export class PropertiesController {
  private readonly service = new PropertiesService();

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.getById(req.params.id);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.create(req.user!.id, req.body);
      created(res, property);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.update(req.params.id, req.user!.id, req.body);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const property = await this.service.publish(req.params.id, req.user!.id);
      ok(res, property);
    } catch (error) {
      next(error);
    }
  };
}

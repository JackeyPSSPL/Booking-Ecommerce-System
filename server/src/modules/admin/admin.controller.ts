import { Request, Response, NextFunction } from 'express';
import { ok } from '../../common/utils/response';
import { AdminService } from './admin.service';

const service = new AdminService();

export class AdminController {
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { ok(res, await service.getStats()); } catch (e) { next(e); }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role  = req.query.role  as string | undefined;
      const page  = Math.max(1, Number(req.query.page  ?? 1));
      const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getUsers(role, page, limit));
    } catch (e) { next(e); }
  };

  getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getProperties(status, page, limit));
    } catch (e) { next(e); }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const page   = Math.max(1, Number(req.query.page  ?? 1));
      const limit  = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
      ok(res, await service.getBookings(status, page, limit));
    } catch (e) { next(e); }
  };

  updatePropertyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      ok(res, await service.updatePropertyStatus(req.params.id, status), 'Status updated');
    } catch (e) { next(e); }
  };
}

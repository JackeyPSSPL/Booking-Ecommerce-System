import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { AdminController } from './admin.controller';

const router = Router();
const ctrl = new AdminController();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/stats',                    ctrl.getStats);
router.get('/users',                    ctrl.getUsers);
router.get('/properties',               ctrl.getProperties);
router.get('/bookings',                 ctrl.getBookings);
router.patch('/properties/:id/status',  ctrl.updatePropertyStatus);

export { router as adminRouter };

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate, validateQuery } from '../../common/middleware/validate.middleware';
import { updatePropertyStatusSchema, listQuerySchema } from './admin.schema';
import { AdminController } from './admin.controller';

const router = Router();
const ctrl = new AdminController();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/stats',                    ctrl.getStats);
router.get('/users',                    validateQuery(listQuerySchema), ctrl.getUsers);
router.get('/properties',               validateQuery(listQuerySchema), ctrl.getProperties);
router.get('/bookings',                 validateQuery(listQuerySchema), ctrl.getBookings);
router.patch('/properties/:id/status',  validate(updatePropertyStatusSchema), ctrl.updatePropertyStatus);

export { router as adminRouter };

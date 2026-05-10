import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authorize } from '../../common/middleware/roles.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { createPropertySchema, updatePropertySchema } from './properties.schema';
import { PropertiesController } from './properties.controller';

const router = Router();
const controller = new PropertiesController();

router.get('/featured', controller.getFeatured);
router.get('/:id', controller.getById);
router.post('/', authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(createPropertySchema), controller.create);
router.patch('/:id', authenticate, authorize(Role.PARTNER, Role.ADMIN), validate(updatePropertySchema), controller.update);
router.post('/:id/publish', authenticate, authorize(Role.PARTNER, Role.ADMIN), controller.publish);

export { router as propertiesRouter };

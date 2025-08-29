import { Router } from 'express';
import {
  createSubcategory,
  getAllSubcategories,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryById
} from '../controllers/subCategory.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// for admin only
router.post('/', authenticate, authorize('ADMIN'), createSubcategory);
router.patch('/:id', authenticate, authorize('ADMIN'), updateSubcategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSubcategory);

// for admin and member both readable
router.get('/', authenticate, getAllSubcategories);
router.get('/:id', authenticate, getSubcategoryById);

export default router;
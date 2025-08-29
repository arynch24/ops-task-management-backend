import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// for admin only
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.patch('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

// for admin and member both readable
router.get('/', authenticate, getAllCategories);
router.get('/:id', authenticate, getCategoryById);

export default router;
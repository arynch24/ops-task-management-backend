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
import { validate } from '../middlewares/validator.middleware';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

/** Create a new category
 * POST /api/categories
 * @description Create a new category
 * @body :{
 *   "name": "string",
 *   "description"(optional): "string"
 * }
 * @returns {Category} - The created category
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), createCategory);

/** Update an existing category
 * PATCH /api/categories/:id
 * @description Update an existing category
 * @body :{
 *   "name": "string",
 *   "description": "string"
 * }
 * @returns {Category} - The updated category
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), updateCategory);

/** Delete an existing category
 * @returns {void}
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

/** Get all categories
 * @returns {Category[]} - The list of categories
 */
router.get('/', authenticate, getAllCategories);

/** Get a category by ID
 * @returns {Category} - The category
 */
router.get('/:id', authenticate, getCategoryById);

export default router;
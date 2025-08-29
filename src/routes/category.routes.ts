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
 * @returns {Category} - The created category
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {ValidationError} - If request body is invalid
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), createCategory);

/** Update an existing category
 * @returns {Category} - The updated category
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If category is not found
 * @throws {ValidationError} - If request body is invalid
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), updateCategory);

/** Delete an existing category
 * @returns {void}
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If category is not found
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

/** Get all categories
 * @returns {Category[]} - The list of categories
 * @throws {UnauthorizedError} - If user is not authenticated
 */
router.get('/', authenticate, getAllCategories);

/** Get a category by ID
 * @returns {Category} - The category
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If category is not found
 */
router.get('/:id', authenticate, getCategoryById);

export default router;
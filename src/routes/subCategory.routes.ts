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
import { validate } from '../middlewares/validator.middleware';
import { createSubcategorySchema, updateSubcategorySchema } from '../validators/subCategory.validator';

const router = Router();

/** Create a new subcategory
 * @returns {Subcategory} - The created subcategory
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {ValidationError} - If request body is invalid
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createSubcategorySchema), createSubcategory);

/** Update an existing subcategory
 * @returns {Subcategory} - The updated subcategory
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If subcategory is not found
 * @throws {ValidationError} - If request body is invalid
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateSubcategorySchema), updateSubcategory);

/** Delete an existing subcategory
 * @returns {void}
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If subcategory is not found
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSubcategory);

/** Get all subcategories
 * @returns {Subcategory[]} - The list of subcategories
 * @throws {UnauthorizedError} - If user is not authenticated
 */
router.get('/', authenticate, getAllSubcategories);

/** Get a subcategory by ID
 * @returns {Subcategory} - The subcategory
 * @throws {UnauthorizedError} - If user is not authenticated
 * @throws {NotFoundError} - If subcategory is not found
 */
router.get('/:id', authenticate, getSubcategoryById);

export default router;
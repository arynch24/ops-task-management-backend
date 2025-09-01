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
 * POST /api/subcategories
 * @description Create a new subcategory
 * @body :{
 *   "name": "string",
 *   "description"(optional): "string",
 *   "categoryId": "string"
 * }
 * @returns {Subcategory} - The created subcategory
 */
router.post('/', authenticate, authorize('ADMIN'), validate(createSubcategorySchema), createSubcategory);

/** Update an existing subcategory
 * PATCH /api/subcategories/:id
 * @description Update an existing subcategory
 * @body :{
 *   "name": "string",
 *   "description": "string",
 *   "categoryId": "string"
 * }
 * @returns {Subcategory} - The updated subcategory
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateSubcategorySchema), updateSubcategory);

/** Delete an existing subcategory
 * @returns {void}
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSubcategory);

/** Get all subcategories
 * @returns {Subcategory[]} - The list of subcategories
 */
router.get('/', authenticate, getAllSubcategories);

/** Get a subcategory by ID
 * @returns {Subcategory} - The subcategory
 */
router.get('/:id', authenticate, getSubcategoryById);

export default router;
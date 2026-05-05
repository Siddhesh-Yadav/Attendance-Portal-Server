import { Router } from 'express';
import { hrController } from '../controllers/HRController';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema, createLeaveTypeSchema, updateLeaveTypeSchema } from '../validators/hr.validators';
import { PERMISSIONS } from '../utils/constants';

const router = Router();

// ─── User Management ────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/hr/users:
 *   get:
 *     tags: [HR]
 *     summary: Get all users (HR only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: role, schema: { type: string } }
 */
router.get('/users', authMiddleware, requirePermission([PERMISSIONS.USER_CREATE]), hrController.getAllUsers);

/**
 * @swagger
 * /api/v1/hr/users:
 *   post:
 *     tags: [HR]
 *     summary: Create a new user (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/users', authMiddleware, requirePermission([PERMISSIONS.USER_CREATE]), validateBody(createUserSchema), hrController.createUser);

/**
 * @swagger
 * /api/v1/hr/users/{id}:
 *   patch:
 *     tags: [HR]
 *     summary: Update user (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id', authMiddleware, requirePermission([PERMISSIONS.USER_ASSIGN_ROLE, PERMISSIONS.USER_ASSIGN_MANAGER]), validateBody(updateUserSchema), hrController.updateUser);

/**
 * @swagger
 * /api/v1/hr/users/{id}/deactivate:
 *   patch:
 *     tags: [HR]
 *     summary: Deactivate a user (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id/deactivate', authMiddleware, requirePermission([PERMISSIONS.USER_DEACTIVATE]), hrController.deactivateUser);

// ─── Leave Type Configuration ───────────────────────────────────

/**
 * @swagger
 * /api/v1/hr/leave-types:
 *   get:
 *     tags: [HR]
 *     summary: Get all leave types
 *     security: [{ bearerAuth: [] }]
 */
router.get('/leave-types', authMiddleware, hrController.getAllLeaveTypes);

/**
 * @swagger
 * /api/v1/hr/leave-types:
 *   post:
 *     tags: [HR]
 *     summary: Create a leave type (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/leave-types', authMiddleware, requirePermission([PERMISSIONS.LEAVE_TYPE_CONFIGURE]), validateBody(createLeaveTypeSchema), hrController.createLeaveType);

/**
 * @swagger
 * /api/v1/hr/leave-types/{id}:
 *   patch:
 *     tags: [HR]
 *     summary: Update a leave type (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/leave-types/:id', authMiddleware, requirePermission([PERMISSIONS.LEAVE_TYPE_CONFIGURE]), validateBody(updateLeaveTypeSchema), hrController.updateLeaveType);

export default router;

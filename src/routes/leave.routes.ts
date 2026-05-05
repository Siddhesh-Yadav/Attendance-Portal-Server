import { Router } from 'express';
import { leaveController } from '../controllers/LeaveController';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { applyLeaveSchema } from '../validators/leave.validators';
import { PERMISSIONS } from '../utils/constants';

const router = Router();

/**
 * @swagger
 * /api/v1/leave/apply:
 *   post:
 *     tags: [Leave]
 *     summary: Apply for leave
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveTypeId, startDate, endDate, reason]
 *             properties:
 *               leaveTypeId: { type: integer, example: 1 }
 *               startDate: { type: string, example: "2024-05-15" }
 *               endDate: { type: string, example: "2024-05-17" }
 *               reason: { type: string, example: "Family emergency" }
 *     responses:
 *       201: { description: Leave request submitted }
 *       409: { description: Quota exceeded or overlapping dates }
 */
router.post('/apply', authMiddleware, requirePermission([PERMISSIONS.LEAVE_APPLY]), validateBody(applyLeaveSchema), leaveController.apply);

/**
 * @swagger
 * /api/v1/leave/own:
 *   get:
 *     tags: [Leave]
 *     summary: Get own leave requests
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, APPROVED, REJECTED, ALL] } }
 */
router.get('/own', authMiddleware, requirePermission([PERMISSIONS.LEAVE_VIEW_OWN]), leaveController.getOwn);

/**
 * @swagger
 * /api/v1/leave/pending:
 *   get:
 *     tags: [Leave]
 *     summary: Get pending leave requests for manager's reportees
 *     security: [{ bearerAuth: [] }]
 */
router.get('/pending', authMiddleware, requirePermission([PERMISSIONS.LEAVE_APPROVE]), leaveController.getPending);

/**
 * @swagger
 * /api/v1/leave/all:
 *   get:
 *     tags: [Leave]
 *     summary: Get all leave requests (HR only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/all', authMiddleware, requirePermission([PERMISSIONS.LEAVE_VIEW_ALL]), leaveController.getAll);

/**
 * @swagger
 * /api/v1/leave/{id}/approve:
 *   post:
 *     tags: [Leave]
 *     summary: Approve a leave request (Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 */
router.post('/:id/approve', authMiddleware, requirePermission([PERMISSIONS.LEAVE_APPROVE]), leaveController.approve);

/**
 * @swagger
 * /api/v1/leave/{id}/reject:
 *   post:
 *     tags: [Leave]
 *     summary: Reject a leave request (Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 */
router.post('/:id/reject', authMiddleware, requirePermission([PERMISSIONS.LEAVE_APPROVE]), leaveController.reject);

export default router;

import { Router } from 'express';
import { attendanceController } from '../controllers/AttendanceController';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../utils/constants';

const router = Router();

/**
 * @swagger
 * /api/v1/attendance/checkin:
 *   post:
 *     tags: [Attendance]
 *     summary: Check in for the day
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Check-in successful }
 *       409: { description: Already checked in }
 */
router.post('/checkin', authMiddleware, requirePermission([PERMISSIONS.ATTENDANCE_CHECKIN]), attendanceController.checkin);

/**
 * @swagger
 * /api/v1/attendance/checkout:
 *   post:
 *     tags: [Attendance]
 *     summary: Check out for the day
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Check-out successful }
 *       409: { description: Not checked in or already checked out }
 */
router.post('/checkout', authMiddleware, requirePermission([PERMISSIONS.ATTENDANCE_CHECKOUT]), attendanceController.checkout);

/**
 * @swagger
 * /api/v1/attendance/own:
 *   get:
 *     tags: [Attendance]
 *     summary: Get own attendance records
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: startDate, schema: { type: string } }
 *       - { in: query, name: endDate, schema: { type: string } }
 *     responses:
 *       200: { description: Attendance records }
 */
router.get('/own', authMiddleware, requirePermission([PERMISSIONS.ATTENDANCE_VIEW_OWN]), attendanceController.getOwn);

/**
 * @swagger
 * /api/v1/attendance/team:
 *   get:
 *     tags: [Attendance]
 *     summary: Get team attendance (Manager/HR)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Team attendance }
 */
router.get('/team', authMiddleware, requirePermission([PERMISSIONS.ATTENDANCE_VIEW_TEAM, PERMISSIONS.ATTENDANCE_VIEW_ALL]), attendanceController.getTeam);

export default router;

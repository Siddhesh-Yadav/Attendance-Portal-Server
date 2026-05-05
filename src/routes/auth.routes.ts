import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema } from '../validators/auth.validators';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "emp1@company.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logout successful }
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     tags: [Auth]
 *     summary: Verify token and get user info
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Token valid }
 *       401: { description: Token invalid }
 */
router.get('/verify', authMiddleware, authController.verify);

export default router;

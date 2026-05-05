import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { AuthError } from '../errors';
import { logger } from '../config/logger';
import { env } from '../config/env';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.authToken;

    if (!token) {
      throw new AuthError('Authentication required. No token provided.');
    }

    // 2. Verify JWT signature
    let payload;
    try {
      payload = verifyJWT(token);
    } catch (jwtError) {
      throw new AuthError('Invalid or expired token');
    }

    // 3. Load session from DB
    const session = await Session.findByPk(payload.sessionId);
    if (!session) {
      throw new AuthError('Session not found. Please login again.');
    }

    // 4. Check session expiry (15-min inactivity timeout)
    const now = new Date();
    if (now > new Date(session.expiresAt)) {
      logger.info('Session expired due to inactivity', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresAt: session.expiresAt,
      });
      throw new AuthError('Session expired due to inactivity. Please login again.');
    }

    // 5. Check if session is revoked
    if (session.revokedAt) {
      throw new AuthError('Session has been revoked. Please login again.');
    }

    // 6. Check if user is still active
    const user = await User.findByPk(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthError('User account is deactivated.');
    }

    // 7. Update session activity (sliding window for 15-min timeout)
    const sessionTimeoutMs = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    await session.update({
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + sessionTimeoutMs),
    });

    // 8. Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(401).json({
        success: false,
        message: err.message,
        errorCode: 'AUTH_FAILED',
      });
      return;
    }
    next(err);
  }
}

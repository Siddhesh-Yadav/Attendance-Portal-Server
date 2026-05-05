import { v4 as uuidv4 } from 'uuid';
import { User, Role, Permission, RolePermission, Session } from '../models';
import { createJWT, JWTPayload } from '../utils/jwt';
import { verifyPassword, hashToken } from '../utils/hash';
import { AuthError } from '../errors';
import { logger } from '../config/logger';
import { env } from '../config/env';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
  };
  expiresIn: number;
}

export class AuthService {
  /**
   * Authenticate user and create a new session.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. Find user by email with role
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      logger.warn('Login failed: user not found', { email });
      throw new AuthError('Invalid credentials');
    }

    // 2. Verify password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      logger.warn('Login failed: invalid password', { email, userId: user.id });
      throw new AuthError('Invalid credentials');
    }

    // 3. Check if user is active
    if (!user.isActive) {
      logger.warn('Login failed: user deactivated', { email, userId: user.id });
      throw new AuthError('User account is deactivated');
    }

    // 4. Load permissions for user's role

    // Need to query permissions differently since RolePermission doesn't have the association set up that way
    const permissionIds = await RolePermission.findAll({
      where: { roleId: user.roleId },
      attributes: ['permissionId'],
    });

    const permissions = await Permission.findAll({
      where: { id: permissionIds.map((rp) => rp.permissionId) },
    });

    const permissionCodes = permissions.map((p) => p.code);

    // 5. Create session
    const sessionId = uuidv4();
    const sessionTimeoutMs = env.SESSION_TIMEOUT_MINUTES * 60 * 1000;
    const now = new Date();

    const jwtPayload: JWTPayload = {
      userId: user.id,
      sessionId,
      email: user.email,
      role: user.role!.code,
      permissions: permissionCodes,
    };

    const token = createJWT(jwtPayload);

    await Session.create({
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(token),
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + sessionTimeoutMs),
      revokedAt: null,
    });

    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      role: user.role!.code,
      sessionId,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role!.code,
        permissions: permissionCodes,
      },
      expiresIn: env.SESSION_TIMEOUT_MINUTES * 60,
    };
  }

  /**
   * Revoke the user's current session (logout).
   */
  async logout(sessionId: string, userId: number): Promise<void> {
    const session = await Session.findByPk(sessionId);
    if (session) {
      await session.update({ revokedAt: new Date() });
      logger.info('User logout successful', { userId, sessionId });
    }
  }

  /**
   * Verify a session is still valid and return user info.
   */
  async verify(userId: number, sessionId: string) {
    const session = await Session.findByPk(sessionId);
    if (!session || session.revokedAt || new Date() > new Date(session.expiresAt)) {
      throw new AuthError('Session invalid or expired');
    }

    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.isActive) {
      throw new AuthError('User not active');
    }

    // Load permissions
    const permissionIds = await RolePermission.findAll({
      where: { roleId: user.roleId },
      attributes: ['permissionId'],
    });

    const permissions = await Permission.findAll({
      where: { id: permissionIds.map((rp) => rp.permissionId) },
    });

    const remainingMs = new Date(session.expiresAt).getTime() - Date.now();

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role!.code,
        permissions: permissions.map((p) => p.code),
      },
      expiresIn: Math.max(0, Math.floor(remainingMs / 1000)),
    };
  }
}

export const authService = new AuthService();

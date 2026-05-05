import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.validatedBody;
      const result = await authService.login(email, password);

      // Set httpOnly cookie
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: env.SESSION_TIMEOUT_MINUTES * 60 * 1000,
      });

      sendSuccess(res, { message: 'Login successful', data: result });
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.sessionId, req.user!.id);
      res.clearCookie('authToken');
      sendSuccess(res, { message: 'Logout successful', data: {} });
    } catch (err) { next(err); }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verify(req.user!.id, req.user!.sessionId);
      sendSuccess(res, { message: 'Token valid', data: result });
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();

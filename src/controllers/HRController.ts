import { Request, Response, NextFunction } from 'express';
import { hrService } from '../services/HRService';
import { sendSuccess } from '../utils/response';

export class HRController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, role, isActive } = req.query as any;
      const result = await hrService.getAllUsers(
        parseInt(page) || 1, parseInt(limit) || 20, role, isActive,
      );
      sendSuccess(res, { message: 'Users retrieved', data: result });
    } catch (err) { next(err); }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hrService.createUser(req.validatedBody);
      sendSuccess(res, { message: 'User created', data: result, statusCode: 201 });
    } catch (err) { next(err); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const result = await hrService.updateUser(userId, req.validatedBody);
      sendSuccess(res, { message: 'User updated', data: result });
    } catch (err) { next(err); }
  }

  async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const result = await hrService.deactivateUser(userId);
      sendSuccess(res, { message: 'User deactivated', data: result });
    } catch (err) { next(err); }
  }

  async getAllLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hrService.getAllLeaveTypes();
      sendSuccess(res, { message: 'Leave types retrieved', data: result });
    } catch (err) { next(err); }
  }

  async createLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hrService.createLeaveType(req.validatedBody);
      sendSuccess(res, { message: 'Leave type created', data: result, statusCode: 201 });
    } catch (err) { next(err); }
  }

  async updateLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await hrService.updateLeaveType(id, req.validatedBody);
      sendSuccess(res, { message: 'Leave type updated', data: result });
    } catch (err) { next(err); }
  }
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hrService.getAllRoles();
      sendSuccess(res, { message: 'Roles retrieved', data: result });
    } catch (err) { next(err); }
  }
}

export const hrController = new HRController();

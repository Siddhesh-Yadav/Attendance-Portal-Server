import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../services/LeaveService';
import { sendSuccess } from '../utils/response';

export class LeaveController {
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.applyLeave(req.user!.id, req.validatedBody);
      sendSuccess(res, { message: 'Leave request submitted', data: result, statusCode: 201 });
    } catch (err) { next(err); }
  }

  async getOwn(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as any;
      console.log(req.user?.id);
      
      const result = await leaveService.getOwnLeaveRequests(req.user!.id, status);
      sendSuccess(res, { message: 'Leave requests retrieved', data: result });
    } catch (err) { next(err); }
  }

  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getTeamLeavesForManager(req.user!.id, req.user!.role);
      sendSuccess(res, { message: 'Team leave requests retrieved', data: result });
    } catch (err) { next(err); }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as any;
      const result = await leaveService.getAllLeaveRequests(status);
      sendSuccess(res, { message: 'All leave requests retrieved', data: result });
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequestId = parseInt(req.params.id, 10);
      const { remark } = req.body;
      const result = await leaveService.approveLeave(leaveRequestId, req.user!.id, remark);
      sendSuccess(res, { message: 'Leave request approved', data: result });
    } catch (err) { next(err); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequestId = parseInt(req.params.id, 10);
      const { remark } = req.body;
      const result = await leaveService.rejectLeave(leaveRequestId, req.user!.id, remark);
      sendSuccess(res, { message: 'Leave request rejected', data: result });
    } catch (err) { next(err); }
  }
}

export const leaveController = new LeaveController();

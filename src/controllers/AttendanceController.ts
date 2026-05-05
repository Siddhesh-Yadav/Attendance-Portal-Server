import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/AttendanceService';
import { sendSuccess } from '../utils/response';

export class AttendanceController {
  async checkin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.checkin(req.user!.id);
      sendSuccess(res, { message: 'Check-in successful', data: result, statusCode: 201 });
    } catch (err) { next(err); }
  }

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.checkout(req.user!.id);
      sendSuccess(res, { message: 'Check-out successful', data: result });
    } catch (err) { next(err); }
  }

  async getOwn(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const result = await attendanceService.getOwnAttendance(req.user!.id, startDate, endDate);
      sendSuccess(res, { message: 'Attendance records retrieved', data: result });
    } catch (err) { next(err); }
  }

  async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const result = await attendanceService.getTeamAttendance(req.user!.id, req.user!.role, startDate, endDate);
      sendSuccess(res, { message: 'Team attendance retrieved', data: result });
    } catch (err) { next(err); }
  }
}

export const attendanceController = new AttendanceController();

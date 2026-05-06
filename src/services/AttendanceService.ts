import { Op } from 'sequelize';
import { AttendanceRecord, User } from '../models';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors';
import { logger } from '../config/logger';
import { getTodayDateString, calculateHours } from '../utils/date';
import { ROLES } from '../utils/constants';

export class AttendanceService {
  /**
   * Check-in for the current day. Prevents multiple check-ins per day.
   */
  async checkin(userId: number) {
    const today = getTodayDateString();

    // Check if already checked in today
    const existing = await AttendanceRecord.findOne({
      where: { userId, date: today },
    });

    if (existing) {
      throw new ConflictError('ALREADY_CHECKED_IN', 'Already checked in for today', {
        checkedInAt: existing.checkInTime,
      });
    }

    const record = await AttendanceRecord.create({
      userId,
      date: today,
      checkInTime: new Date(),
      checkOutTime: null,
    });

    logger.info('User checked in', { userId, recordId: record.id, date: today });

    return {
      id: record.id,
      userId: record.userId,
      date: record.date,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      status: 'CHECKED_IN',
    };
  }

  /**
   * Check-out for the current day.
   */
  async checkout(userId: number) {
    const today = getTodayDateString();

    const record = await AttendanceRecord.findOne({
      where: { userId, date: today },
    });

    if (!record) {
      throw new ConflictError('NOT_CHECKED_IN', 'No active check-in for today');
    }

    if (record.checkOutTime) {
      throw new ConflictError('ALREADY_CHECKED_OUT', 'Already checked out for today', {
        checkedOutAt: record.checkOutTime,
      });
    }

    const checkOutTime = new Date();
    const hoursWorked = calculateHours(new Date(record.checkInTime), checkOutTime);

    await record.update({ checkOutTime });

    logger.info('User checked out', { userId, recordId: record.id, hoursWorked });

    return {
      id: record.id,
      userId: record.userId,
      date: record.date,
      checkInTime: record.checkInTime,
      checkOutTime,
      hoursWorked,
    };
  }

  /**
   * Get own attendance records within a date range.
   */
  async getOwnAttendance(userId: number, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const records = await AttendanceRecord.findAll({
      where,
      order: [['date', 'DESC']],
    });

    const formattedRecords = records.map((r) => ({
      id: r.id,
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      status: r.checkOutTime ? 'CHECKED_OUT' : 'CHECKED_IN',
      hoursWorked: r.checkOutTime ? calculateHours(new Date(r.checkInTime), new Date(r.checkOutTime)) : null,
    }));

    return {
      records: formattedRecords,
      totalDays: formattedRecords.length,
    };
  }

  /**
   * Get team attendance records (for manager: reportees only; for HR: all users).
   */
  async getTeamAttendance(userId: number, role: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    let userFilter: any = {};

    if (role === ROLES.MANAGER) {
      // Manager sees only reportees
      userFilter = { managerId: userId };
    }
    // HR sees all users (no filter)

    const records = await AttendanceRecord.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
          where: Object.keys(userFilter).length > 0 ? userFilter : undefined,
        },
      ],
      order: [['date', 'DESC']],
    });

    const formattedRecords = records.map((r) => ({
      userId: r.userId,
      userName: (r as any).user?.fullName,
      userEmail: (r as any).user?.email,
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      hoursWorked: r.checkOutTime ? calculateHours(new Date(r.checkInTime), new Date(r.checkOutTime)) : null,
    }));

    return {
      records: formattedRecords,
      totalRecords: formattedRecords.length,
    };
  }
}

export const attendanceService = new AttendanceService();

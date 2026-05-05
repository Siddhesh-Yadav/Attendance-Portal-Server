import { Op } from 'sequelize';
import { LeaveRequest, LeaveType, User } from '../models';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors';
import { logger } from '../config/logger';
import { calculateLeaveDays, getCurrentYear } from '../utils/date';
import { ROLES, LEAVE_STATUS } from '../utils/constants';
import { ApplyLeaveDTO } from '../validators/leave.validators';

export class LeaveService {
  async applyLeave(userId: number, data: ApplyLeaveDTO) {
    const leaveType = await LeaveType.findByPk(data.leaveTypeId);
    if (!leaveType) throw new NotFoundError('LeaveType', data.leaveTypeId);

    const leaveDays = calculateLeaveDays(data.startDate, data.endDate);
    if (leaveDays <= 0) throw new ConflictError('INVALID_DATE_RANGE', 'No working days in selected range');

    const currentYear = getCurrentYear();
    const approvedDays = await this.getApprovedLeaveDays(userId, data.leaveTypeId, currentYear);

    if (approvedDays + leaveDays > leaveType.annualQuota) {
      throw new ConflictError('QUOTA_EXCEEDED', 'Insufficient leave quota', {
        leaveType: leaveType.name, quota: leaveType.annualQuota,
        approved: approvedDays, remaining: leaveType.annualQuota - approvedDays, requested: leaveDays,
      });
    }

    const overlapping = await LeaveRequest.findOne({
      where: {
        userId, status: { [Op.in]: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
        [Op.or]: [
          { startDate: { [Op.between]: [data.startDate, data.endDate] } },
          { endDate: { [Op.between]: [data.startDate, data.endDate] } },
          { [Op.and]: [{ startDate: { [Op.lte]: data.startDate } }, { endDate: { [Op.gte]: data.endDate } }] },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictError('OVERLAPPING_LEAVE', 'You already have a leave request for overlapping dates');
    }

    const leaveRequest = await LeaveRequest.create({
      userId, leaveTypeId: data.leaveTypeId, startDate: data.startDate,
      endDate: data.endDate, reason: data.reason, status: LEAVE_STATUS.PENDING,
    });

    logger.info('Leave request submitted', { userId, leaveRequestId: leaveRequest.id, leaveType: leaveType.name, leaveDays });

    return {
      id: leaveRequest.id, userId, leaveTypeId: leaveRequest.leaveTypeId,
      leaveTypeName: leaveType.name, startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate, reason: leaveRequest.reason,
      status: leaveRequest.status, leaveDays, createdAt: leaveRequest.createdAt,
    };
  }

  async approveLeave(leaveRequestId: number, approverId: number, remark?: string) {
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId);
    if (!leaveRequest) throw new NotFoundError('LeaveRequest', leaveRequestId);
    if (leaveRequest.userId === approverId) throw new ForbiddenError('Cannot approve your own leave request');
    if (leaveRequest.status !== LEAVE_STATUS.PENDING) throw new ConflictError('LEAVE_ALREADY_ACTIONED', `Leave already ${leaveRequest.status.toLowerCase()}`);

    const employee = await User.findByPk(leaveRequest.userId);
    if (!employee || employee.managerId !== approverId) throw new ForbiddenError('You are not the manager of this employee');

    await leaveRequest.update({ status: LEAVE_STATUS.APPROVED, approvedBy: approverId, approvalRemark: remark || null, approvedAt: new Date() });
    logger.info('Leave request approved', { leaveRequestId, approverId, employeeId: leaveRequest.userId });

    return { id: leaveRequest.id, status: LEAVE_STATUS.APPROVED, approvedBy: approverId, approvalRemark: remark || null, approvedAt: leaveRequest.approvedAt };
  }

  async rejectLeave(leaveRequestId: number, approverId: number, remark?: string) {
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId);
    if (!leaveRequest) throw new NotFoundError('LeaveRequest', leaveRequestId);
    if (leaveRequest.userId === approverId) throw new ForbiddenError('Cannot reject your own leave request');
    if (leaveRequest.status !== LEAVE_STATUS.PENDING) throw new ConflictError('LEAVE_ALREADY_ACTIONED', `Leave already ${leaveRequest.status.toLowerCase()}`);

    const employee = await User.findByPk(leaveRequest.userId);
    if (!employee || employee.managerId !== approverId) throw new ForbiddenError('You are not the manager of this employee');

    await leaveRequest.update({ status: LEAVE_STATUS.REJECTED, approvedBy: approverId, rejectionRemark: remark || 'No reason provided', approvedAt: new Date() });
    logger.info('Leave request rejected', { leaveRequestId, approverId, employeeId: leaveRequest.userId });

    return { id: leaveRequest.id, status: LEAVE_STATUS.REJECTED, approvedBy: approverId, rejectionRemark: remark || 'No reason provided' };
  }

  async getOwnLeaveRequests(userId: number, status?: string) {
    const where: any = { userId };
    if (status && status !== 'ALL') where.status = status;

    const requests = await LeaveRequest.findAll({
      where,
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'annualQuota'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      requests: requests.map((r) => ({
        id: r.id, leaveType: (r as any).leaveType?.name, leaveTypeId: r.leaveTypeId,
        startDate: r.startDate, endDate: r.endDate, reason: r.reason, status: r.status,
        leaveDays: calculateLeaveDays(r.startDate, r.endDate),
        approver: (r as any).approver ? { id: (r as any).approver.id, name: (r as any).approver.fullName } : null,
        approvalRemark: r.approvalRemark, rejectionRemark: r.rejectionRemark,
        approvedAt: r.approvedAt, createdAt: r.createdAt,
      })),
    };
  }

  async getPendingForManager(managerId: number) {
    const reportees = await User.findAll({ where: { managerId }, attributes: ['id'] });
    const reporteeIds = reportees.map((r) => r.id);
    if (reporteeIds.length === 0) return { requests: [], totalPending: 0 };

    const requests = await LeaveRequest.findAll({
      where: { userId: { [Op.in]: reporteeIds }, status: LEAVE_STATUS.PENDING },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    return {
      requests: requests.map((r) => ({
        id: r.id, userId: r.userId, userName: (r as any).user?.fullName,
        userEmail: (r as any).user?.email, leaveType: (r as any).leaveType?.name,
        startDate: r.startDate, endDate: r.endDate, reason: r.reason,
        leaveDays: calculateLeaveDays(r.startDate, r.endDate), createdAt: r.createdAt,
      })),
      totalPending: requests.length,
    };
  }

  async getAllLeaveRequests(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const requests = await LeaveRequest.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      requests: requests.map((r) => ({
        id: r.id, userId: r.userId, userName: (r as any).user?.fullName,
        leaveType: (r as any).leaveType?.name, startDate: r.startDate, endDate: r.endDate,
        reason: r.reason, status: r.status, leaveDays: calculateLeaveDays(r.startDate, r.endDate),
        approver: (r as any).approver ? { id: (r as any).approver.id, name: (r as any).approver.fullName } : null,
        approvedAt: r.approvedAt, createdAt: r.createdAt,
      })),
      total: requests.length,
    };
  }

  private async getApprovedLeaveDays(userId: number, leaveTypeId: number, year: number): Promise<number> {
    const approvedRequests = await LeaveRequest.findAll({
      where: {
        userId, leaveTypeId, status: LEAVE_STATUS.APPROVED,
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });
    return approvedRequests.reduce((total, req) => total + calculateLeaveDays(req.startDate, req.endDate), 0);
  }
}

export const leaveService = new LeaveService();

import { Op } from 'sequelize';
import { User, Role, Session, LeaveType } from '../models';
import { ConflictError, NotFoundError } from '../errors';
import { hashPassword, generateTempPassword } from '../utils/hash';
import { logger } from '../config/logger';

export class HRService {
  async getAllUsers(page: number = 1, limit: number = 20, roleFilter?: string, activeFilter?: string) {
    const where: any = {};
    if (roleFilter) {
      const role = await Role.findOne({ where: { code: roleFilter } });
      if (role) where.roleId = role.id;
    }
    if (activeFilter !== undefined) where.isActive = activeFilter === 'true';

    const offset = (page - 1) * limit;
    const { rows: users, count: total } = await User.findAndCountAll({
      where, limit, offset,
      include: [
        { model: Role, as: 'role', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'manager', attributes: ['id', 'fullName', 'email'] },
      ],
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });

    return {
      users: users.map((u) => ({
        id: u.id, email: u.email, fullName: u.fullName,
        role: (u as any).role?.code, roleName: (u as any).role?.name,
        manager: (u as any).manager ? { id: (u as any).manager.id, name: (u as any).manager.fullName } : null,
        isActive: u.isActive, createdAt: u.createdAt,
      })),
      total, page, limit,
    };
  }

  async createUser(data: { email: string; fullName: string; roleId: number; managerId?: number | null; password?: string }) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictError('EMAIL_EXISTS', 'Email already in use');

    const role = await Role.findByPk(data.roleId);
    if (!role) throw new NotFoundError('Role', data.roleId);

    if (data.managerId) {
      const manager = await User.findByPk(data.managerId);
      if (!manager) throw new NotFoundError('Manager', data.managerId);
    }

    const password = data.password || generateTempPassword();
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email: data.email, fullName: data.fullName, passwordHash,
      roleId: data.roleId, managerId: data.managerId || null, isActive: true,
    });

    logger.info('User created', { userId: user.id, email: user.email, role: role.code });

    return {
      id: user.id, email: user.email, fullName: user.fullName,
      role: role.code, isActive: true, temporaryPassword: password,
    };
  }

  async updateUser(userId: number, data: { fullName?: string; roleId?: number; managerId?: number | null }) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User', userId);

    if (data.roleId) {
      const role = await Role.findByPk(data.roleId);
      if (!role) throw new NotFoundError('Role', data.roleId);
    }

    if (data.managerId) {
      const manager = await User.findByPk(data.managerId);
      if (!manager) throw new NotFoundError('Manager', data.managerId);
    }

    await user.update(data);
    logger.info('User updated', { userId, updates: Object.keys(data) });

    const updated = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'manager', attributes: ['id', 'fullName'] },
      ],
      attributes: { exclude: ['passwordHash'] },
    });

    return {
      id: updated!.id, email: updated!.email, fullName: updated!.fullName,
      role: (updated as any).role?.code,
      manager: (updated as any).manager ? { id: (updated as any).manager.id, name: (updated as any).manager.fullName } : null,
      isActive: updated!.isActive,
    };
  }

  async deactivateUser(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User', userId);

    await user.update({ isActive: false });

    // Revoke all active sessions
    await Session.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
    logger.info('User deactivated', { userId });

    return { id: user.id, email: user.email, isActive: false };
  }

  async getAllLeaveTypes() {
    return LeaveType.findAll({ order: [['name', 'ASC']] });
  }

  async createLeaveType(data: { name: string; annualQuota: number; description?: string }) {
    const leaveType = await LeaveType.create(data);
    logger.info('Leave type created', { leaveTypeId: leaveType.id, name: leaveType.name });
    return leaveType;
  }

  async updateLeaveType(id: number, data: { name?: string; annualQuota?: number; description?: string }) {
    const leaveType = await LeaveType.findByPk(id);
    if (!leaveType) throw new NotFoundError('LeaveType', id);
    await leaveType.update(data);
    logger.info('Leave type updated', { leaveTypeId: id });
    return leaveType;
  }
  async getAllRoles() {
    return Role.findAll({ order: [['id', 'ASC']] });
  }
}

export const hrService = new HRService();

import { Role } from './Role';
import { Permission } from './Permission';
import { RolePermission } from './RolePermission';
import { User } from './User';
import { Session } from './Session';
import { AttendanceRecord } from './AttendanceRecord';
import { LeaveType } from './LeaveType';
import { LeaveRequest } from './LeaveRequest';

// ─── Associations ───────────────────────────────────────────────

// Role <-> Permission (Many-to-Many through RolePermission)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User <-> Role (Many-to-One)
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// User <-> User (Manager self-reference)
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(User, { foreignKey: 'managerId', as: 'reportees' });

// User <-> Session (One-to-Many)
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> AttendanceRecord (One-to-Many)
User.hasMany(AttendanceRecord, { foreignKey: 'userId', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> LeaveRequest (One-to-Many - as applicant)
User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> LeaveRequest (One-to-Many - as approver)
User.hasMany(LeaveRequest, { foreignKey: 'approvedBy', as: 'approvedLeaves' });
LeaveRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// LeaveType <-> LeaveRequest (One-to-Many)
LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// ─── Exports ────────────────────────────────────────────────────

export {
  Role,
  Permission,
  RolePermission,
  User,
  Session,
  AttendanceRecord,
  LeaveType,
  LeaveRequest,
};

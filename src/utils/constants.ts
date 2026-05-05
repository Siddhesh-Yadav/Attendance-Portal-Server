export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  HR: 'HR',
} as const;

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const PERMISSIONS = {
  ATTENDANCE_CHECKIN: 'attendance:checkin',
  ATTENDANCE_CHECKOUT: 'attendance:checkout',
  ATTENDANCE_VIEW_OWN: 'attendance:view_own',
  ATTENDANCE_VIEW_TEAM: 'attendance:view_team',
  ATTENDANCE_VIEW_ALL: 'attendance:view_all',
  LEAVE_APPLY: 'leave:apply',
  LEAVE_VIEW_OWN: 'leave:view_own',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_VIEW_ALL: 'leave:view_all',
  USER_CREATE: 'user:create',
  USER_DEACTIVATE: 'user:deactivate',
  USER_ASSIGN_ROLE: 'user:assign_role',
  USER_ASSIGN_MANAGER: 'user:assign_manager',
  LEAVE_TYPE_CONFIGURE: 'leave_type:configure',
} as const;

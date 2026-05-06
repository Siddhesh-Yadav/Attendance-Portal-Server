import { sequelize, connectDatabase } from '../config/database';
import { logger } from '../config/logger';
import '../models';
import { Role, Permission, RolePermission, User, LeaveType } from '../models';
import { hashPassword } from '../utils/hash';

const PERMISSIONS_DATA = [
  { code: 'attendance:checkin', description: 'Can check in', category: 'attendance' },
  { code: 'attendance:checkout', description: 'Can check out', category: 'attendance' },
  { code: 'attendance:view_own', description: 'Can view own attendance', category: 'attendance' },
  { code: 'attendance:view_team', description: 'Can view team attendance', category: 'attendance' },
  { code: 'attendance:view_all', description: 'Can view all attendance', category: 'attendance' },
  { code: 'leave:apply', description: 'Can apply for leave', category: 'leave' },
  { code: 'leave:view_own', description: 'Can view own leave requests', category: 'leave' },
  { code: 'leave:approve', description: 'Can approve/reject leave', category: 'leave' },
  { code: 'leave:view_all', description: 'Can view all leave requests', category: 'leave' },
  { code: 'user:create', description: 'Can create users', category: 'user' },
  { code: 'user:deactivate', description: 'Can deactivate users', category: 'user' },
  { code: 'user:assign_role', description: 'Can assign roles', category: 'user' },
  { code: 'user:assign_manager', description: 'Can assign managers', category: 'user' },
  {
    code: 'leave_type:configure',
    description: 'Can configure leave types',
    category: 'leave_type',
  },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  EMPLOYEE: [
    'attendance:checkin',
    'attendance:checkout',
    'attendance:view_own',
    'leave:apply',
    'leave:view_own',
  ],
  MANAGER: [
    'attendance:checkin',
    'attendance:checkout',
    'attendance:view_own',
    'attendance:view_team',
    'leave:apply',
    'leave:view_own',
    'leave:approve',
    'leave:view_all',
  ],
  HR: [
    'attendance:view_team',
    'attendance:view_all',
    'leave:view_all',
    'user:create',
    'user:deactivate',
    'user:assign_role',
    'user:assign_manager',
    'leave_type:configure',
    'leave:approve',
  ],
};

async function seed() {
  try {
    await connectDatabase();
    // sequelize.sync() removed as per production requirements.
    // Ensure schema is created via SQL migration/dump before seeding.

    logger.info('🌱 Starting database seeding...');

    // 1. Seed Roles
    const roles = await Role.bulkCreate([
      { code: 'EMPLOYEE', name: 'Employee', description: 'Regular staff member' },
      { code: 'MANAGER', name: 'Manager', description: 'Team lead or senior staff' },
      { code: 'HR', name: 'HR Administrator', description: 'HR admin with full access' },
    ]);
    logger.info(`✅ Seeded ${roles.length} roles`);

    // 2. Seed Permissions
    const permissions = await Permission.bulkCreate(PERMISSIONS_DATA);
    logger.info(`✅ Seeded ${permissions.length} permissions`);

    // 3. Seed Role-Permission Mappings
    const rolePermEntries: { roleId: number; permissionId: number }[] = [];
    for (const role of roles) {
      const permCodes = ROLE_PERMISSION_MAP[role.code] || [];
      for (const code of permCodes) {
        const perm = permissions.find((p) => p.code === code);
        if (perm) {
          rolePermEntries.push({ roleId: role.id, permissionId: perm.id });
        }
      }
    }
    await RolePermission.bulkCreate(rolePermEntries);
    logger.info(`✅ Seeded ${rolePermEntries.length} role-permission mappings`);

    // 4. Seed Users
    const passwordHash = await hashPassword('password123');
    const hrRole = roles.find((r) => r.code === 'HR')!;
    const mgrRole = roles.find((r) => r.code === 'MANAGER')!;
    const empRole = roles.find((r) => r.code === 'EMPLOYEE')!;

    const hr = await User.create({
      email: 'hr@company.com',
      fullName: 'HR Admin',
      passwordHash,
      roleId: hrRole.id,
      managerId: null,
      isActive: true,
    });

    const manager = await User.create({
      email: 'manager@company.com',
      fullName: 'John Manager',
      passwordHash,
      roleId: mgrRole.id,
      managerId: null,
      isActive: true,
    });

    const emp1 = await User.create({
      email: 'emp1@company.com',
      fullName: 'Alice Employee',
      passwordHash,
      roleId: empRole.id,
      managerId: manager.id,
      isActive: true,
    });

    const emp2 = await User.create({
      email: 'emp2@company.com',
      fullName: 'Bob Employee',
      passwordHash,
      roleId: empRole.id,
      managerId: manager.id,
      isActive: true,
    });

    const emp3 = await User.create({
      email: 'emp3@company.com',
      fullName: 'Charlie Employee',
      passwordHash,
      roleId: empRole.id,
      managerId: manager.id,
      isActive: true,
    });

    logger.info('✅ Seeded 5 users (hr, manager, emp1, emp2, emp3)');

    // 5. Seed Leave Types
    await LeaveType.bulkCreate([
      { name: 'Casual Leave', annualQuota: 12, description: 'Casual leave for personal reasons' },
      { name: 'Sick Leave', annualQuota: 10, description: 'Sick leave for health reasons' },
      { name: 'Earned Leave', annualQuota: 20, description: 'Annual earned leave' },
    ]);
    logger.info('✅ Seeded 3 leave types');

    logger.info('🎉 Database seeding complete!');
    logger.info('');
    logger.info('Test Credentials:');
    logger.info('  HR:       hr@company.com / password123');
    logger.info('  Manager:  manager@company.com / password123');
    logger.info('  Employee: emp1@company.com / password123');
    logger.info('  Employee: emp2@company.com / password123');
    logger.info('  Employee: emp3@company.com / password123');

    process.exit(0);
  } catch (error) {
    console.log(error);
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

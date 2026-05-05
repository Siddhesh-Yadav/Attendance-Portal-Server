import { AuthService } from '../../../src/services/AuthService';
import { User, Role, Permission, RolePermission, Session } from '../../../src/models';
import { verifyPassword } from '../../../src/utils/hash';
import { AuthError } from '../../../src/errors';
import * as jwt from '../../../src/utils/jwt';

jest.mock('../../../src/models');
jest.mock('../../../src/utils/hash');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/config/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('AuthService', () => {
  const authService = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user and create session successfully', async () => {
      // Setup mocks
      const mockUser = {
        id: 1,
        email: 'test@company.com',
        passwordHash: 'hashed_password',
        isActive: true,
        roleId: 1,
        role: { code: 'EMPLOYEE' },
      };

      const mockRolePermission = [{ permissionId: 1 }, { permissionId: 2 }];
      const mockPermissions = [{ code: 'perm1' }, { code: 'perm2' }];

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (RolePermission.findAll as jest.Mock).mockResolvedValue(mockRolePermission);
      (Permission.findAll as jest.Mock).mockResolvedValue(mockPermissions);
      (jwt.createJWT as jest.Mock).mockReturnValue('mocked.jwt.token');
      (Session.create as jest.Mock).mockResolvedValue({});

      // Execute
      const result = await authService.login('test@company.com', 'password123');

      // Verify
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@company.com' },
        include: [{ model: Role, as: 'role' }],
      });
      expect(verifyPassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(Session.create).toHaveBeenCalled();
      
      expect(result.token).toBe('mocked.jwt.token');
      expect(result.user.email).toBe('test@company.com');
      expect(result.user.permissions).toEqual(['perm1', 'perm2']);
    });

    it('should throw AuthError if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('wrong@company.com', 'password123')).rejects.toThrow(AuthError);
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw AuthError if password is incorrect', async () => {
      const mockUser = { id: 1, email: 'test@company.com', passwordHash: 'hashed' };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@company.com', 'wrongpassword')).rejects.toThrow(AuthError);
    });

    it('should throw AuthError if user is deactivated', async () => {
      const mockUser = { id: 1, email: 'test@company.com', passwordHash: 'hashed', isActive: false };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);

      await expect(authService.login('test@company.com', 'password123')).rejects.toThrow('User account is deactivated');
    });
  });

  describe('logout', () => {
    it('should revoke session', async () => {
      const mockSession = { update: jest.fn() };
      (Session.findByPk as jest.Mock).mockResolvedValue(mockSession);

      await authService.logout('session-id', 1);

      expect(Session.findByPk).toHaveBeenCalledWith('session-id');
      expect(mockSession.update).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
    });
  });

  describe('verify', () => {
    it('should verify valid session and return user', async () => {
      const mockSession = {
        expiresAt: new Date(Date.now() + 10000).toISOString(),
        revokedAt: null,
      };
      
      const mockUser = {
        id: 1,
        email: 'test@company.com',
        isActive: true,
        roleId: 1,
        role: { code: 'EMPLOYEE' },
      };

      const mockRolePermission = [{ permissionId: 1 }];
      const mockPermissions = [{ code: 'perm1' }];

      (Session.findByPk as jest.Mock).mockResolvedValue(mockSession);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (RolePermission.findAll as jest.Mock).mockResolvedValue(mockRolePermission);
      (Permission.findAll as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await authService.verify(1, 'session-id');

      expect(result.user.email).toBe('test@company.com');
      expect(result.user.permissions).toEqual(['perm1']);
    });

    it('should throw AuthError if session expired', async () => {
      const mockSession = {
        expiresAt: new Date(Date.now() - 10000).toISOString(), // Past date
        revokedAt: null,
      };

      (Session.findByPk as jest.Mock).mockResolvedValue(mockSession);

      await expect(authService.verify(1, 'session-id')).rejects.toThrow('Session invalid or expired');
    });
  });
});

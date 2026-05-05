import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  managerId: z.number().int().positive().nullable().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  roleId: z.number().int().positive().optional(),
  managerId: z.number().int().positive().nullable().optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

export const createLeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  annualQuota: z.number().int().positive('Annual quota must be positive'),
  description: z.string().max(500).optional(),
});

export type CreateLeaveTypeDTO = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  annualQuota: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

export type UpdateLeaveTypeDTO = z.infer<typeof updateLeaveTypeSchema>;

export const userQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  role: z.string().optional(),
  isActive: z.string().optional(),
});

export type UserQueryDTO = z.infer<typeof userQuerySchema>;

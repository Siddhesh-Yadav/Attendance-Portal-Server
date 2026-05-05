import { z } from 'zod';

export const applyLeaveSchema = z
  .object({
    leaveTypeId: z.number().int().positive('Leave type ID must be a positive integer'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason must not exceed 500 characters'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be >= start date',
    path: ['endDate'],
  });

export type ApplyLeaveDTO = z.infer<typeof applyLeaveSchema>;

export const leaveActionSchema = z.object({
  remark: z.string().min(1, 'Remark is required').max(500).optional(),
});

export type LeaveActionDTO = z.infer<typeof leaveActionSchema>;

export const leaveQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).optional().default('ALL'),
});

export type LeaveQueryDTO = z.infer<typeof leaveQuerySchema>;

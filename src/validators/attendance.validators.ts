import { z } from 'zod';

export const attendanceQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AttendanceQueryDTO = z.infer<typeof attendanceQuerySchema>;

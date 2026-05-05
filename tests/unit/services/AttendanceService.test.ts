import { AttendanceService } from '../../../src/services/AttendanceService';
import { AttendanceRecord, User } from '../../../src/models';
import { ConflictError } from '../../../src/errors';
import * as dateUtils from '../../../src/utils/date';

jest.mock('../../../src/models');
jest.mock('../../../src/config/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('AttendanceService', () => {
  const attendanceService = new AttendanceService();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(dateUtils, 'getTodayDateString').mockReturnValue('2024-05-15');
    jest.spyOn(dateUtils, 'calculateHours').mockReturnValue(8.5);
  });

  describe('checkin', () => {
    it('should check in successfully', async () => {
      (AttendanceRecord.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockRecord = {
        id: 1,
        userId: 1,
        date: '2024-05-15',
        checkInTime: new Date('2024-05-15T09:00:00Z'),
        checkOutTime: null,
      };
      
      (AttendanceRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const result = await attendanceService.checkin(1);

      expect(AttendanceRecord.findOne).toHaveBeenCalledWith({
        where: { userId: 1, date: '2024-05-15' },
      });
      expect(AttendanceRecord.create).toHaveBeenCalled();
      expect(result.status).toBe('CHECKED_IN');
      expect(result.id).toBe(1);
    });

    it('should throw ConflictError if already checked in', async () => {
      (AttendanceRecord.findOne as jest.Mock).mockResolvedValue({
        id: 1, checkInTime: new Date(),
      });

      await expect(attendanceService.checkin(1)).rejects.toThrow(ConflictError);
      expect(AttendanceRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('should check out successfully and calculate hours', async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        date: '2024-05-15',
        checkInTime: new Date('2024-05-15T09:00:00Z'),
        checkOutTime: null,
        update: jest.fn().mockResolvedValue(true),
      };

      (AttendanceRecord.findOne as jest.Mock).mockResolvedValue(mockRecord);

      const result = await attendanceService.checkout(1);

      expect(mockRecord.update).toHaveBeenCalledWith({ checkOutTime: expect.any(Date) });
      expect(result.hoursWorked).toBe(8.5);
    });

    it('should throw ConflictError if no check-in found', async () => {
      (AttendanceRecord.findOne as jest.Mock).mockResolvedValue(null);

      await expect(attendanceService.checkout(1)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if already checked out', async () => {
      const mockRecord = {
        id: 1, checkOutTime: new Date(),
      };
      (AttendanceRecord.findOne as jest.Mock).mockResolvedValue(mockRecord);

      await expect(attendanceService.checkout(1)).rejects.toThrow(ConflictError);
    });
  });
});

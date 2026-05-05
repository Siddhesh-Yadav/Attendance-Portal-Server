import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { LeaveType } from './LeaveType';

interface LeaveRequestAttributes {
  id: number;
  userId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: number | null;
  rejectionRemark: string | null;
  approvalRemark: string | null;
  approvedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveRequestCreationAttributes
  extends Optional<LeaveRequestAttributes, 'id' | 'status' | 'approvedBy' | 'rejectionRemark' | 'approvalRemark' | 'approvedAt'> {}

export class LeaveRequest
  extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes>
  implements LeaveRequestAttributes
{
  public id!: number;
  public userId!: number;
  public leaveTypeId!: number;
  public startDate!: string;
  public endDate!: string;
  public reason!: string;
  public status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public approvedBy!: number | null;
  public rejectionRemark!: string | null;
  public approvalRemark!: string | null;
  public approvedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: User;
  public leaveType?: LeaveType;
  public approver?: User;
}

LeaveRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leave_types',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    rejectionRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvalRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['startDate', 'endDate'] },
      { fields: ['approvedBy'] },
    ],
    validate: {
      endDateAfterStartDate(this: LeaveRequest) {
        if (this.endDate < this.startDate) {
          throw new Error('End date must be >= start date');
        }
      },
    },
  },
);

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AttendanceRecordAttributes {
  id: number;
  userId: number;
  date: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttendanceRecordCreationAttributes extends Optional<AttendanceRecordAttributes, 'id' | 'checkOutTime'> {}

export class AttendanceRecord extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes> implements AttendanceRecordAttributes {
  public id!: number;
  public userId!: number;
  public date!: string;
  public checkInTime!: Date;
  public checkOutTime!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AttendanceRecord.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'attendance_records',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date'],
        name: 'unique_user_date_attendance',
      },
      { fields: ['date'] },
    ],
  },
);

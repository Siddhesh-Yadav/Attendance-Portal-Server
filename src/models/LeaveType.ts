import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface LeaveTypeAttributes {
  id: number;
  name: string;
  annualQuota: number;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeaveTypeCreationAttributes extends Optional<LeaveTypeAttributes, 'id' | 'description'> {}

export class LeaveType extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes> implements LeaveTypeAttributes {
  public id!: number;
  public name!: string;
  public annualQuota!: number;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LeaveType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    annualQuota: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_types',
    timestamps: true,
  },
);

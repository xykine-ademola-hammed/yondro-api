import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";
import { Department } from "./Department";
import { Position } from "./Position";
import { Employee } from "./Employee";

@Table({
  tableName: "employee_positions",
  timestamps: true,
})
export class EmployeePosition extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  departmentId!: number;

  @ForeignKey(() => Position)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  positionId!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  employeeId!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endDate?: Date;

  @BelongsTo(() => Department)
  department!: Department;

  @BelongsTo(() => Position)
  position!: Position;

  @BelongsTo(() => Employee)
  employee!: Employee;
}

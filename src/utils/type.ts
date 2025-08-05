import { Department, Organization, Position } from "../models";
import { ModelStatic } from 'sequelize';

export const modelMap: { [key: string]: ModelStatic<any> } = {
  department: Department,
  organization: Organization,
  position: Position,
};

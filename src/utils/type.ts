import { Department, Organization, Position, Stage } from "../models";
import { ModelStatic } from "sequelize";

export const modelMap: { [key: string]: ModelStatic<any> } = {
  department: Department,
  organization: Organization,
  position: Position,
  stages: Stage,
};

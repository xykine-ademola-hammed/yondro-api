import 'reflect-metadata';
import { Organization } from './Organization';
import { Department } from './Department';
import { Position } from './Position';
import { Employee } from './Employee';
import { Workflow } from './Workflow';
import { Stage } from './Stage';
import { WorkflowRequest } from './WorkflowRequest';
import { WorkflowInstanceStage } from './WorkflowInstanceStage';

// Export all models
export {
  Organization,
  Department,
  Position,
  Employee,
  Workflow,
  Stage,
  WorkflowRequest,
  WorkflowInstanceStage
};

// Note: Associations are now defined using decorators in the model files
// sequelize-typescript will automatically handle the associations
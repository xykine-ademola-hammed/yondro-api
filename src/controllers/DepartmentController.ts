import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import { Department, Organization, Employee, Position, Unit } from "../models";
import { buildWhereClause, Filter } from "../utils/filterWhereBuilder";
import { Op } from "sequelize";

export class DepartmentController {
  private static departmentService = new BaseService(Department);

  /**
   * POST /department - Create department
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        organizationId,
        name,
        description,
        units,
        financeCode,
        schoolOrOfficeId,
      } = req.body;

      if (!organizationId || !name) {
        res.status(400).json({
          error: "organizationId and name are required",
        });
        return;
      }

      const department =
        await DepartmentController.departmentService.createOnly({
          organizationId: Number(organizationId),
          schoolOrOfficeId: Number(schoolOrOfficeId),
          name,
          description,
          isActive: true,
          financeCode: financeCode,
        });

      for (let unit of units) {
        if (unit.id) {
          await Unit.update(
            { id: unit.id },
            {
              ...unit,
              departmentId: department?.id,
              organizationId: organizationId,
            }
          );
          continue;
        }
        await Unit.create({
          ...unit,
          departmentId: department?.id,
          organizationId: organizationId,
        });
      }

      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  static async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, name, description } = req.body;

      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const where = buildWhereClause(filters);

      const result =
        await DepartmentController.departmentService.findWithPagination({
          page: offset ? Number(offset) : 1,
          limit: limit ? Number(limit) : 10,
          search: search as string,
          where,
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name"],
            },
            {
              model: Employee,
              as: "employees",
              attributes: ["id", "firstName", "lastName", "isActive"],
            },
            {
              model: Unit,
              as: "units",
            },
          ],
        });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  /**
   * GET /department - Get all departments with pagination
   */

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, organizationId } = req.query;

      const where: any = {};

      if (organizationId) {
        where.organizationId = Number(organizationId);
      }

      if (search) {
        where.name = { [Op.like]: `%${search}%` };
      }

      const result =
        await DepartmentController.departmentService.findWithPagination({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          where,
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name"],
            },
            {
              model: Employee,
              as: "employees",
              attributes: ["id", "firstName", "lastName", "isActive"],
            },
          ],
        });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get departments",
      });
    }
  }

  static async lookupDepartments(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search } = req.body;

      const where: any = {};

      where.organizationId = Number(req.user?.organizationId);

      if (search) {
        where.name = { [Op.like]: `%${search}%` };
      }

      const result =
        await DepartmentController.departmentService.findWithPagination({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          where,
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name"],
            },
            {
              model: Employee,
              as: "employees",
              attributes: ["id", "firstName", "lastName", "isActive"],
            },
          ],
        });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get departments",
      });
    }
  }

  /**
   * GET /department/:id - Get department by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid department id is required",
        });
        return;
      }

      const department = await DepartmentController.departmentService.findById(
        Number(id),
        {
          include: [
            {
              model: Organization,
              as: "organization",
            },
            {
              model: Employee,
              as: "employees",
              include: [
                {
                  model: Position,
                  as: "position",
                },
              ],
            },
          ],
        }
      );

      if (!department) {
        res.status(404).json({
          error: "Department not found",
        });
        return;
      }

      res.json({
        success: true,
        data: department,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get department",
      });
    }
  }

  /**
   * PUT /department/:id - Update department
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid department id is required",
        });
        return;
      }

      const department = await DepartmentController.departmentService.update(
        Number(id),
        updateData
      );

      if (!department) {
        res.status(404).json({
          error: "Department not found",
        });
        return;
      }

      res.json({
        success: true,
        data: department,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to update department",
      });
    }
  }

  /**
   * DELETE /department/:id - Delete department
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid department id is required",
        });
        return;
      }

      const deleted = await DepartmentController.departmentService.delete(
        Number(id)
      );

      if (!deleted) {
        res.status(404).json({
          error: "Department not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to delete department",
      });
    }
  }
}

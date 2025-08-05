import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import { Position, Organization, Department } from "../models";
import { Op } from "sequelize";
import { buildQueryWithIncludes, Filter } from "../utils/filterWhereBuilder";

export class PositionController {
  private static positionService = new BaseService(Position);

  /**
   * POST /position - Create position
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, departmentId, title, description } = req.body;

      if (!organizationId || !departmentId || !title) {
        res.status(400).json({
          success: false,
          error: "organizationId, departmentId and title are required",
        });
        return;
      }

      // Verify organization and department exist
      const organization = await Organization.findByPk(Number(organizationId));
      if (!organization) {
        res.status(404).json({
          success: false,
          error: "Organization not found",
        });
        return;
      }

      const department = await Department.findByPk(Number(departmentId));
      if (!department) {
        res.status(404).json({
          success: false,
          error: "Department not found",
        });
        return;
      }

      const position = await PositionController.positionService.create({
        organizationId,
        departmentId,
        title,
        description,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        data: position,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create position",
      });
    }
  }

  static async getPositions(req: Request, res: Response): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const { where } = buildQueryWithIncludes(filters);

      const result =
        await PositionController.positionService.findWithPagination({
          page: offset ? Number(offset) : 1,
          limit: limit ? Number(limit) : 10,
          search: search as string,
          where,
          include: [Department],
        });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  /**
   * GET /position - Get all positions with pagination
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, organizationId, departmentId } = req.query;

      let where: any = {};
      if (organizationId) {
        where.organizationId = Number(organizationId);
      }
      if (departmentId) {
        where.departmentId = Number(departmentId);
      }

      // Custom search logic for positions
      let searchWhere = where;
      if (search) {
        searchWhere = {
          ...where,
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      const result =
        await PositionController.positionService.findWithPagination({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          where: searchWhere,
          include: [
            {
              model: Organization,
              as: "organization",
              attributes: ["id", "name"],
            },
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get positions",
      });
    }
  }

  /**
   * GET /position/:id - Get position by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          error: "Valid position id is required",
        });
        return;
      }

      const position = await PositionController.positionService.findById(
        Number(id),
        {
          include: [
            {
              model: Organization,
              as: "organization",
            },
            {
              model: Department,
              as: "department",
            },
          ],
        }
      );

      if (!position) {
        res.status(404).json({
          success: false,
          error: "Position not found",
        });
        return;
      }

      res.json({
        success: true,
        data: position,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get position",
      });
    }
  }

  /**
   * PUT /position/:id - Update position
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          error: "Valid position id is required",
        });
        return;
      }

      const position = await PositionController.positionService.update(
        Number(id),
        updateData
      );

      if (!position) {
        res.status(404).json({
          success: false,
          error: "Position not found",
        });
        return;
      }

      res.json({
        success: true,
        data: position,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update position",
      });
    }
  }

  /**
   * DELETE /position/:id - Delete position
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          error: "Valid position id is required",
        });
        return;
      }

      const deleted = await PositionController.positionService.delete(
        Number(id)
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Position not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Position deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete position",
      });
    }
  }
}

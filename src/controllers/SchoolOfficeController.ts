import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import {
  SchoolOrOffice,
  Organization,
  Department,
  Position,
  Unit,
} from "../models";
import { buildWhereClause, Filter } from "../utils/filterWhereBuilder";

export class SchoolOrOfficeController {
  private static schoolOrOfficeService = new BaseService(SchoolOrOffice);

  /**
   * POST /schoolOrOffice - Create schoolOrOffice
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, name, description, units, financeCode } =
        req.body;

      if (!organizationId || !name) {
        res.status(400).json({
          error: "organizationId and name are required",
        });
        return;
      }

      const schoolOrOffice =
        await SchoolOrOfficeController.schoolOrOfficeService.createOnly({
          organizationId: Number(organizationId),
          name,
          description,
          isActive: true,
          financeCode: financeCode,
        });

      for (let unit of units) {
        // const createdUnit = await create Unit passing the schoolOrOfficeId and financeCode (schoolOrOffice.id, unit.name, unit.financeCode)
        for (let subUnit of unit.subUnits) {
          // const createdSubUnit = await createSubUnit (createdUnitId, subUnit.financeCode, subUnit.name )
        }
      }

      res.status(201).json({
        success: true,
        data: schoolOrOffice,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create schoolOrOffice",
      });
    }
  }

  static async getSchoolOrOffices(req: Request, res: Response): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const where = buildWhereClause(filters);

      const result =
        await SchoolOrOfficeController.schoolOrOfficeService.findWithPagination(
          {
            page: offset ? Number(offset) : 1,
            limit: limit ? Number(limit) : 10,
            search: search as string,
            where,
            include: [
              Position,
              {
                model: Organization,
                as: "organization",
              },
              {
                model: Department,
                as: "departments",
                include: [
                  {
                    model: Unit,
                    as: "units", // use alias, based on @HasMany(() => Unit)
                  },
                  {
                    model: Position,
                    as: "positions", // use alias, based on @HasMany(() => Position)
                  },
                ],
              },
            ],
          }
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create schoolOrOffice",
      });
    }
  }

  /**
   * GET /schoolOrOffice - Get all schoolOrOffices with pagination
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, organizationId } = req.query;

      let where = {};
      if (organizationId) {
        where = { organizationId: Number(organizationId) };
      }

      const result =
        await SchoolOrOfficeController.schoolOrOfficeService.findWithPagination(
          {
            page: page ? Number(page) : 1,
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
                model: Department,
                as: "departments",
                attributes: ["id", "firstName", "lastName", "isActive"],
              },
            ],
          }
        );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get schoolOrOffices",
      });
    }
  }

  /**
   * GET /schoolOrOffice/:id - Get schoolOrOffice by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid schoolOrOffice id is required",
        });
        return;
      }

      const schoolOrOffice =
        await SchoolOrOfficeController.schoolOrOfficeService.findById(
          Number(id),
          {
            include: [
              {
                model: Organization,
                as: "organization",
              },
              {
                model: Department,
                as: "departments",
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

      if (!schoolOrOffice) {
        res.status(404).json({
          error: "SchoolOrOffice not found",
        });
        return;
      }

      res.json({
        success: true,
        data: schoolOrOffice,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get schoolOrOffice",
      });
    }
  }

  /**
   * PUT /schoolOrOffice/:id - Update schoolOrOffice
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid schoolOrOffice id is required",
        });
        return;
      }

      const schoolOrOffice =
        await SchoolOrOfficeController.schoolOrOfficeService.update(
          Number(id),
          updateData
        );

      if (!schoolOrOffice) {
        res.status(404).json({
          error: "SchoolOrOffice not found",
        });
        return;
      }

      res.json({
        success: true,
        data: schoolOrOffice,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to update schoolOrOffice",
      });
    }
  }

  /**
   * DELETE /schoolOrOffice/:id - Delete schoolOrOffice
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid schoolOrOffice id is required",
        });
        return;
      }

      const deleted =
        await SchoolOrOfficeController.schoolOrOfficeService.delete(Number(id));

      if (!deleted) {
        res.status(404).json({
          error: "SchoolOrOffice not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "SchoolOrOffice deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to delete schoolOrOffice",
      });
    }
  }
}

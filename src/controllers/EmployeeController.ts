import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import { Employee, Department, Position, Unit } from "../models";
import { Op } from "sequelize";
import { buildQueryWithIncludes, Filter } from "../utils/filterWhereBuilder";
import { AuthController } from "./AuthController";

export class EmployeeController {
  private static employeeService = new BaseService(Employee);

  /**
   * POST /employee - Create employee
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        departmentId,
        organizationId,
        positionId,
        schoolOrOfficeId,
        unitId,
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
      } = req.body;

      if (
        !positionId ||
        !firstName ||
        !lastName ||
        !email ||
        !organizationId ||
        !password
      ) {
        res.status(400).json({
          error:
            "positionId, firstName, lastName, email, and password are required",
        });
        return;
      }

      const employee = await EmployeeController.employeeService.createOnly({
        departmentId,
        organizationId,
        positionId,
        firstName,
        lastName,
        schoolOrOfficeId,
        unitId,
        email,
        phone,
        password,
        role: role,
        isActive: true,
        permission: new AuthController().getDefaultPermissionsForRole(
          role.toLowerCase()
        ),
      });

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create employee",
      });
    }
  }

  static async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, name, description } = req.body;

      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const { where, include } = buildQueryWithIncludes(filters, Position);

      const { count, rows } = await Employee.findAndCountAll({
        where,
        include: [
          { model: Department, as: "department", include: [Unit] },
          Position,
          ...include,
        ],
        distinct: true, // <- ensures COUNT(DISTINCT Employee.id)
        limit: 1000,
        offset,
        order: [["createdAt", "DESC"]], // <- correct order syntax
        subQuery: false, // <- helps with DISTINCT + LIMIT in some dialects (esp. Postgres)
      });

      const result = {
        rows,
        pagination: {
          page: offset,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  /**
   * GET /employee - Get all employees with pagination
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, departmentId } = req.query;

      let where = {};
      if (departmentId) {
        where = { departmentId: Number(departmentId) };
      }

      // Custom search logic for employees
      let searchWhere = where;
      if (search) {
        searchWhere = {
          ...where,
          [Op.or]: [
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      const result =
        await EmployeeController.employeeService.findWithPagination({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          where: searchWhere,
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
            {
              model: Position,
              as: "position",
              attributes: ["id", "title"],
            },
          ],
        });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get employees",
      });
    }
  }

  /**
   * GET /employee/:id - Get employee by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid employee id is required",
        });
        return;
      }

      const employee = await EmployeeController.employeeService.findById(
        Number(id),
        {
          include: [
            {
              model: Department,
              as: "department",
            },
            {
              model: Position,
              as: "position",
            },
          ],
        }
      );

      if (!employee) {
        res.status(404).json({
          error: "Employee not found",
        });
        return;
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get employee",
      });
    }
  }

  /**
   * PUT /employee/:id - Update employee
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid employee id is required",
        });
        return;
      }

      const employee = await EmployeeController.employeeService.update(
        Number(id),
        updateData
      );

      if (!employee) {
        res.status(404).json({
          error: "Employee not found",
        });
        return;
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to update employee",
      });
    }
  }

  /**
   * DELETE /employee/:id - Delete employee
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid employee id is required",
        });
        return;
      }

      const deleted = await EmployeeController.employeeService.delete(
        Number(id)
      );

      if (!deleted) {
        res.status(404).json({
          error: "Employee not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to delete employee",
      });
    }
  }
}

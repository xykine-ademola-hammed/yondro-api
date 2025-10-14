import { Response, Request } from "express";
import { Op } from "sequelize";
import FiscalYear from "../models/FiscalYear";
import { Organization } from "../models";
import { AuditEventType, AuditService } from "../services/AuditService";

export class FiscalYearController {
  static async getFiscalYears(req: Request, res: Response) {
    try {
      const { search, is_current, is_closed, page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { organization_id: req?.user?.organizationId };

      // Apply filters
      if (is_current !== undefined && is_current !== "") {
        where.is_current = is_current === "true";
      }
      if (is_closed !== undefined && is_closed !== "") {
        where.is_closed = is_closed === "true";
      }

      if (search) {
        where[Op.or] = [{ year: { [Op.like]: `%${search}%` } }];
      }

      const { rows: fiscalYears, count: total } =
        await FiscalYear.findAndCountAll({
          where,
          include: [
            {
              model: Organization,
              attributes: ["id", "name"],
            },
          ],
          order: [["year", "DESC"]],
          limit: Number(limit),
          offset,
        });

      res.json({
        fiscalYears,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get fiscal years error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getFiscalYear(req: Request, res: Response) {
    try {
      const fiscalYear = await FiscalYear.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [
          {
            model: Organization,
            attributes: ["id", "name", "code"],
          },
        ],
      });

      if (!fiscalYear) {
        return res.status(404).json({ message: "Fiscal year not found" });
      }

      res.json(fiscalYear);
    } catch (error) {
      console.error("Get fiscal year error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async createFiscalYear(req: Request, res: Response) {
    try {
      const { year, start_date, end_date, is_current = false } = req.body;

      // Validate input
      if (!year || !start_date || !end_date) {
        return res
          .status(400)
          .json({ message: "Year, start date, and end date are required" });
      }

      // Check if fiscal year already exists for this organization
      const existingFiscalYear = await FiscalYear.findOne({
        where: {
          organization_id: req?.user?.organizationId!,
          year: year,
        },
      });

      if (existingFiscalYear) {
        return res.status(400).json({
          message: "Fiscal year already exists for this organization",
        });
      }

      // Validate date range
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (endDate <= startDate) {
        return res
          .status(400)
          .json({ message: "End date must be after start date" });
      }

      // Check for reasonable duration (300-400 days)
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (durationDays < 300 || durationDays > 400) {
        return res.status(400).json({
          message: "Fiscal year duration should be between 300-400 days",
        });
      }

      // If setting as current, update existing current fiscal year
      if (is_current) {
        await FiscalYear.update(
          { is_current: false },
          {
            where: {
              organization_id: req?.user?.organizationId!,
              is_current: true,
            },
          }
        );
      }

      // Create fiscal year
      const fiscalYear = await FiscalYear.create({
        organization_id: req?.user?.organizationId!,
        year,
        start_date: startDate,
        end_date: endDate,
        is_current,
        is_closed: false,
      });

      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.FISCAL_YEAR,
        ip: req.ip,
        meta: {
          action: "create",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.status(201).json(fiscalYear);
    } catch (error) {
      console.error("Create fiscal year error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async updateFiscalYear(req: Request, res: Response) {
    try {
      const fiscalYear = await FiscalYear.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
      });

      if (!fiscalYear) {
        return res.status(404).json({ message: "Fiscal year not found" });
      }

      if (fiscalYear.is_closed) {
        return res
          .status(400)
          .json({ message: "Cannot update closed fiscal year" });
      }

      const oldValues = fiscalYear.toJSON();
      const updateData = { ...req.body };

      // If setting as current, update existing current fiscal year
      if (updateData.is_current && !fiscalYear.is_current) {
        await FiscalYear.update(
          { is_current: false },
          {
            where: {
              organization_id: req?.user?.organizationId!,
              is_current: true,
            },
          }
        );
      }

      await fiscalYear.update(updateData);

      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.FISCAL_YEAR,
        ip: req.ip,
        meta: {
          action: "update",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.json(fiscalYear);
    } catch (error) {
      console.error("Update fiscal year error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async closeFiscalYear(req: Request, res: Response) {
    try {
      const fiscalYear = await FiscalYear.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
      });

      if (!fiscalYear) {
        return res.status(404).json({ message: "Fiscal year not found" });
      }

      if (fiscalYear.is_closed) {
        return res
          .status(400)
          .json({ message: "Fiscal year is already closed" });
      }

      // TODO: Add validation to ensure all vouchers are processed
      // TODO: Add validation to ensure all budget adjustments are posted
      // TODO: Generate year-end reports

      await fiscalYear.update({
        is_closed: true,
        is_current: false, // Closed years cannot be current
      });

      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.FISCAL_YEAR,
        ip: req.ip,
        meta: {
          action: "close",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.json({ message: "Fiscal year closed successfully", fiscalYear });
    } catch (error) {
      console.error("Close fiscal year error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async setCurrentFiscalYear(req: Request, res: Response) {
    try {
      const fiscalYear = await FiscalYear.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
      });

      if (!fiscalYear) {
        return res.status(404).json({ message: "Fiscal year not found" });
      }

      if (fiscalYear.is_closed) {
        return res
          .status(400)
          .json({ message: "Cannot set closed fiscal year as current" });
      }

      if (fiscalYear.is_current) {
        return res
          .status(400)
          .json({ message: "Fiscal year is already current" });
      }

      // Update existing current fiscal year
      await FiscalYear.update(
        { is_current: false },
        {
          where: {
            organization_id: req?.user?.organizationId!,
            is_current: true,
          },
        }
      );

      // Set new current fiscal year
      await fiscalYear.update({ is_current: true });

      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.FISCAL_YEAR,
        ip: req.ip,
        meta: {
          action: "update",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.json({
        message: "Current fiscal year updated successfully",
        fiscalYear,
      });
    } catch (error) {
      console.error("Set current fiscal year error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

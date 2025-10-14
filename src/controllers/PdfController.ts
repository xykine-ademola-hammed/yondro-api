import { Response, Request } from "express";
import { Op } from "sequelize";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { AuditEventType, AuditService } from "../services/AuditService";

// Import models for entity mapping
import Voucher from "../models/Voucher";
import VoteBookAccount from "../models/VoteBookAccount";
import { Employee } from "../models/Employee";
import BudgetAdjustment from "../models/BudgetAdjustment";
import ApprovalAction from "../models/ApprovalAction";
import Payment from "../models/Payment";
import FiscalYear from "../models/FiscalYear";
import { Department } from "../models/Department";
import { Organization } from "../models/Organization";
import VoucherLine from "../models/VoucherLine";
import NcoaCode from "../models/NcoaCode";

interface FilterStructure {
  [key: string]: any;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  department_id?: number;
  fiscal_year_id?: number;
}

export class PdfController {
  private static entityMap = {
    vouchers: {
      model: Voucher,
      includes: [
        {
          model: Employee,
          as: "requester",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: Employee,
          as: "headOfVoucherUnit",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: Employee,
          as: "voucherCreator",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: Employee,
          as: "voucherReviewer",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: Employee,
          as: "voucherApprover",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: VoucherLine,
          include: [
            {
              model: VoteBookAccount,
              attributes: ["id", "code", "name"],
            },
          ],
        },
        {
          model: Department,
          attributes: ["id", "name", "code"],
        },
      ],
      searchFields: ["voucher_number", "payee_name", "purpose"],
    },
    votebook: {
      model: VoteBookAccount,
      includes: [
        {
          model: FiscalYear,
          attributes: ["id", "year", "is_current"],
        },
        {
          model: Department,
          attributes: ["id", "name", "code"],
        },
        {
          model: NcoaCode,
          attributes: [
            "id",
            "code",
            "economic_type",
            "fg_title",
            "state_title",
            "lg_title",
          ],
        },
      ],
      searchFields: ["code", "name"],
    },
    users: {
      model: Employee,
      includes: [
        {
          model: Organization,
          attributes: ["id", "name", "code"],
        },
        {
          model: Department,
          attributes: ["id", "name", "code"],
        },
      ],
      searchFields: ["first_name", "last_name", "email"],
      excludeFields: ["password"],
    },
    budget_adjustments: {
      model: BudgetAdjustment,
      includes: [
        {
          model: VoteBookAccount,
          as: "fromAccount",
          attributes: ["id", "code", "name"],
        },
        {
          model: VoteBookAccount,
          as: "toAccount",
          attributes: ["id", "code", "name"],
        },
        {
          model: Employee,
          as: "requestor",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: Employee,
          as: "approver",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      searchFields: ["reference_number", "justification"],
    },
    payments: {
      model: Payment,
      includes: [
        {
          model: Voucher,
          attributes: ["id", "voucher_number", "payee_name", "purpose"],
        },
        {
          model: Employee,
          as: "processor",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      searchFields: ["payment_reference", "bank_reference"],
    },
    fiscal_years: {
      model: FiscalYear,
      includes: [
        {
          model: Organization,
          attributes: ["id", "name", "code"],
        },
      ],
      searchFields: ["year"],
    },
  };

  static async generatePdf(req: Request, res: Response) {
    try {
      const { entityName, filterStructure } = req.body;

      // Validate input
      if (!entityName || !filterStructure) {
        return res
          .status(400)
          .json({ message: "entityName and filterStructure are required" });
      }

      // Check if entity is supported
      const entityConfig =
        this.entityMap[entityName as keyof typeof this.entityMap];
      if (!entityConfig) {
        return res.status(400).json({
          message: "Unsupported entity",
          supportedEntities: Object.keys(this.entityMap),
        });
      }

      // Build query based on filter structure
      const queryOptions = await this.buildQuery(
        entityConfig,
        filterStructure,
        req?.user?.organizationId!
      );

      // Fetch data
      const data = await (entityConfig.model as any).findAll(queryOptions);

      // Get organization info for header
      const organization = await Organization.findByPk(
        req?.user?.organizationId
      );

      // Prepare template data
      const templateData = {
        entityName,
        data: data.map((item: { toJSON: () => any }) => item.toJSON()),
        organization: organization?.toJSON(),
        filters: filterStructure,
        generatedAt: new Date(),
        generatedBy: {
          name: `${req.user!.firstName} ${req.user!.lastName}`,
          email: req.user!.email,
          role: req.user!.role,
        },
        totalRecords: data.length,
        // Helper functions for templates
        formatCurrency: (amount: number, currency = "USD") => {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
          }).format(amount);
        },
        formatDate: (date: string | Date) => {
          return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
        formatDateTime: (date: string | Date) => {
          return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
        capitalize: (str: string) => {
          return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
        },
      };

      // Generate PDF
      const pdfBuffer = await this.generatePdfFromTemplate(
        entityName,
        templateData
      );

      // Log the PDF generation

      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.PDF,
        ip: req.ip,
        meta: {
          action: "generate",
        },
        userAgent: req.get("Employee-Agent"),
      });

      // Set response headers
      const filename = `${entityName}_report_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate PDF error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  }

  private static async buildQuery(
    entityConfig: any,
    filters: FilterStructure,
    organizationId: number
  ) {
    const where: any = {};

    // Always filter by organization
    if (entityConfig.model.rawAttributes.organization_id) {
      where.organization_id = organizationId;
    } else if (entityConfig.model.name === "VoteBookAccount") {
      // For vote book accounts, filter through fiscal year
      const fiscalYears = await FiscalYear.findAll({
        where: { organization_id: organizationId },
        attributes: ["id"],
      });
      where.fiscal_year_id = { [Op.in]: fiscalYears.map((fy) => fy.id) };
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        switch (key) {
          case "search":
            if (
              entityConfig.searchFields &&
              entityConfig.searchFields.length > 0
            ) {
              where[Op.or] = entityConfig.searchFields.map((field: string) => ({
                [field]: { [Op.like]: `%${value}%` },
              }));
            }
            break;
          case "date_from":
            where.created_at = { [Op.gte]: new Date(value as string) };
            break;
          case "date_to":
            where.created_at = {
              ...where.created_at,
              [Op.lte]: new Date(value as string),
            };
            break;
          case "page":
          case "limit":
            // Skip pagination fields
            break;
          default:
            where[key] = value;
        }
      }
    });

    const queryOptions: any = {
      where,
      include: entityConfig.includes || [],
      order: [["created_at", "DESC"]],
    };

    // Add attributes exclusion if specified
    if (entityConfig.excludeFields) {
      queryOptions.attributes = { exclude: entityConfig.excludeFields };
    }

    // Apply pagination if specified
    if (filters.limit) {
      queryOptions.limit = Number(filters.limit);
      if (filters.page) {
        queryOptions.offset =
          (Number(filters.page) - 1) * Number(filters.limit);
      }
    }

    return queryOptions;
  }

  private static async generatePdfFromTemplate(
    entityName: string,
    data: any
  ): Promise<Buffer> {
    try {
      // Template file path
      const templatePath = path.join(
        __dirname,
        "../templates",
        `${entityName}.ejs`
      );

      // Check if specific template exists, otherwise use generic template
      let templateFile = templatePath;
      if (!fs.existsSync(templatePath)) {
        templateFile = path.join(__dirname, "../templates", "generic.ejs");
      }

      // Render EJS template
      const html = await ejs.renderFile(templateFile, data);

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      if (html)
        await page.setContent(html?.toString(), {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  static async getAvailableEntities(req: Request, res: Response) {
    try {
      const entities = Object.keys(this.entityMap).map((key) => ({
        name: key,
        displayName: key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        searchFields:
          this.entityMap[key as keyof typeof this.entityMap].searchFields || [],
      }));

      res.json({ entities });
    } catch (error) {
      console.error("Get available entities error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

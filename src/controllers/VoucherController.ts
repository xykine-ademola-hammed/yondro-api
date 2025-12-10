import { Response, Request } from "express";
import { Op, Transaction } from "sequelize";
import Voucher from "../models/Voucher";
import VoucherLine from "../models/VoucherLine";
import ApprovalAction from "../models/ApprovalAction";
import { Employee, Workflow, WorkflowRequest } from "../models";
import VoteBookAccount from "../models/VoteBookAccount";
import VoteBookService from "../services/voteBookService";
import sequelize from "../config/database";
import { AuditEventType, AuditService } from "../services/AuditService";

export class VoucherController {
  static async getVouchers(req: Request, res: Response) {
    try {
      const {
        status,
        department_id,
        requester_id,
        page = 1,
        limit = 20,
        search,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { organization_id: req?.user?.organizationId };

      // Apply filters
      if (status) where.status = status;
      if (department_id) where.department_id = department_id;
      if (requester_id) where.requester_id = requester_id;

      if (search) {
        where[Op.or] = [
          { voucher_number: { [Op.like]: `%${search}%` } },
          { payee_name: { [Op.like]: `%${search}%` } },
          { purpose: { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows: vouchers, count: total } = await Voucher.findAndCountAll({
        where,
        include: [
          {
            model: Employee,
            as: "requester",
            attributes: ["id", "first_name", "last_name", "email"],
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
        ],
        order: [["created_at", "DESC"]],
        limit: Number(limit),
        offset,
      });

      res.json({
        vouchers,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get vouchers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getVoucher(req: Request, res: Response) {
    try {
      const voucher = await Voucher.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [
          {
            model: Employee,
            as: "requester",
            attributes: ["id", "first_name", "last_name", "email"],
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
            model: ApprovalAction,
            include: [
              {
                model: Employee,
                as: "actor",
                attributes: ["id", "first_name", "last_name"],
              },
            ],
          },
        ],
      });

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      res.json(voucher);
    } catch (error) {
      console.error("Get voucher error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getVoucherByEntityIds(req: Request, res: Response) {
    try {
      const { entityIds } = req.body;

      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        return res
          .status(400)
          .json({ message: "entityIds must be a non-empty array" });
      }

      const vouchers = await Voucher.findAll({
        where: {
          organization_id: req?.user?.organizationId,
          entity_id: {
            [Op.in]: entityIds,
          },
        },
        include: [
          {
            model: WorkflowRequest,
            attributes: ["id", "requestor_id", "workflow_id", "form_id"],
            include: [
              {
                model: Employee,
                as: "requestor",
                attributes: ["id", "firstName", "lastName", "email"],
              },
              { model: Workflow, attributes: ["id", "name"] },
              {
                model: WorkflowRequest,
                as: "parentRequest",
                attributes: ["id", "requestor_id", "workflow_id"],
                include: [
                  {
                    model: Employee,
                    as: "requestor",
                    attributes: ["id", "firstName", "lastName", "email"],
                  },
                  { model: Workflow, attributes: ["id", "name"] },
                ],
              },
            ],
          },
        ],
        attributes: [
          "id",
          "voucher_number",
          "status",
          "total_amount",
          "created_at",
        ],
        order: [["created_at", "DESC"]],
      });

      res.json(vouchers);
    } catch (error) {
      console.error("Get vouchers by entity IDs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async createVoucher(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const {
        payee_name,
        payee_address,
        purpose,
        currency = "USD",
        priority = "medium",
        due_date,
        invoice_number,
        po_number,
        notes,
        lines,
      } = req.body;

      // Validate input
      if (!payee_name || !purpose || !lines || lines.length === 0) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Calculate totals
      let total_amount = 0;
      let tax_amount = 0;

      for (const line of lines) {
        total_amount += Number(line.total_amount);
        tax_amount += Number(line.tax_amount || 0);
      }

      const net_amount = total_amount - tax_amount;

      // Generate voucher number
      const year = new Date().getFullYear();
      const lastVoucher = await Voucher.findOne({
        where: {
          organization_id: req?.user?.organizationId!,
          voucher_number: {
            [Op.like]: `${req?.user?.organizationId}-${year}-%`,
          },
        },
        order: [["created_at", "DESC"]],
      });

      let sequence = 1;
      if (lastVoucher) {
        const lastSequence = parseInt(lastVoucher.voucher_number.split("-")[2]);
        sequence = lastSequence + 1;
      }

      const voucher_number = `${req?.user?.organizationId}-${year}-${sequence
        .toString()
        .padStart(6, "0")}`;

      // Create voucher
      const voucher = await Voucher.create(
        {
          voucher_number,
          organization_id: req?.user?.organizationId!,
          requester_id: req.user!.id,
          payee_name,
          payee_address,
          purpose,
          total_amount,
          tax_amount,
          net_amount,
          currency,
          priority,
          due_date: due_date ? new Date(due_date) : undefined,
          invoice_number,
          po_number,
          notes,
          status: "draft",
          attachment_count: 0,
        },
        { transaction: t }
      );

      // Create voucher lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await VoucherLine.create(
          {
            voucher_id: voucher.id,
            account_id: line.account_id,
            line_number: i + 1,
            description: line.description,
            quantity: line.quantity || 1,
            unit_cost: line.unit_cost,
            total_amount: line.total_amount,
            tax_code: line.tax_code,
            tax_amount: line.tax_amount || 0,
          },
          { transaction: t }
        );
      }

      // Log the creation
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER,
        ip: req.ip,
        meta: {
          action: "create",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      // Fetch the created voucher with includes
      const createdVoucher = await Voucher.findByPk(voucher.id, {
        include: [
          {
            model: VoucherLine,
            include: [
              {
                model: VoteBookAccount,
                attributes: ["id", "code", "name"],
              },
            ],
          },
        ],
      });

      res.status(201).json(createdVoucher);
    } catch (error) {
      await t.rollback();
      console.error("Create voucher error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async submitVoucher(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const voucher = await Voucher.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
          requester_id: req.user!.id,
        },
        include: [{ model: VoucherLine }],
      });

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      if (voucher.status !== "draft") {
        return res
          .status(400)
          .json({ message: "Can only submit draft vouchers" });
      }

      // Validate against vote book
      const lines = voucher.voucherLines!.map((line: any) => ({
        account_id: line.account_id,
        total_amount: Number(line.total_amount),
      }));

      const validationResults = await VoteBookService.validateVoucherImpact(
        lines
      );
      const hasErrors = validationResults.some((result) => !result.valid);

      if (hasErrors) {
        return res.status(400).json({
          message: "Voucher validation failed",
          validationResults,
        });
      }

      // Commit funds
      await VoteBookService.commitFunds(lines, t);

      // Update voucher status
      await voucher.update({ status: "submitted" }, { transaction: t });

      // Log the submission
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER,
        ip: req.ip,
        meta: {
          action: "submit",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({ message: "Voucher submitted successfully", voucher });
    } catch (error) {
      await t.rollback();
      console.error("Submit voucher error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async simulateVoucherImpact(req: Request, res: Response) {
    try {
      const voucher = await Voucher.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [{ model: VoucherLine }],
      });

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const lines = voucher.voucherLines!.map((line: any) => ({
        account_id: line.account_id,
        total_amount: Number(line.total_amount),
      }));

      const simulation = await VoteBookService.simulateVoucherImpact(lines);

      res.json({ simulation });
    } catch (error) {
      console.error("Simulate voucher impact error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async approveVoucher(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const { comment, level } = req.body;

      const voucher = await Voucher.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
      });

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // Determine next status based on current status and user role
      let nextStatus = voucher.status;
      let approvalLevel = 1;

      switch (voucher.status) {
        case "submitted":
          nextStatus = "approved_l1";
          approvalLevel = 1;
          break;
        case "approved_l1":
          nextStatus = "approved_l2";
          approvalLevel = 2;
          break;
        case "approved_l2":
          nextStatus = "approved_l3";
          approvalLevel = 3;
          break;
        case "approved_l3":
          nextStatus = "finance_approved";
          approvalLevel = 3; // Finance approval
          break;
        default:
          return res
            .status(400)
            .json({ message: "Invalid voucher status for approval" });
      }

      // Create approval action
      await ApprovalAction.create(
        {
          voucher_id: voucher.id,
          actor_id: req.user!.id,
          level: level || approvalLevel,
          action: "approve",
          comment,
          decision_date: new Date(),
          ip_address: req.ip,
          user_agent: req.get("Employee-Agent"),
        },
        { transaction: t }
      );

      // Update voucher status
      await voucher.update({ status: nextStatus }, { transaction: t });

      // Log the approval
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER,
        ip: req.ip,
        meta: {
          action: "approval",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({ message: "Voucher approved successfully", voucher });
    } catch (error) {
      await t.rollback();
      console.error("Approve voucher error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async rejectVoucher(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const { comment, reason } = req.body;

      const voucher = await Voucher.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [{ model: VoucherLine }],
      });

      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      // Release committed funds
      if (voucher.status !== "draft") {
        const lines = voucher.voucherLines!.map((line: any) => ({
          account_id: line.account_id,
          total_amount: Number(line.total_amount),
        }));

        await VoteBookService.releaseFunds(lines, t);
      }

      // Create approval action
      await ApprovalAction.create(
        {
          voucher_id: voucher.id,
          actor_id: req.user!.id,
          level: 1,
          action: "reject",
          comment,
          decision_date: new Date(),
          ip_address: req.ip,
          user_agent: req.get("Employee-Agent"),
        },
        { transaction: t }
      );

      // Update voucher status
      await voucher.update(
        {
          status: "rejected",
          rejection_reason: reason,
        },
        { transaction: t }
      );

      // Log the rejection
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER,
        ip: req.ip,
        meta: {
          action: "reject",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({ message: "Voucher rejected successfully" });
    } catch (error) {
      await t.rollback();
      console.error("Reject voucher error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

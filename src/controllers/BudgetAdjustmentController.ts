import { Response, Request } from "express";
import { Op, Transaction } from "sequelize";
import BudgetAdjustment from "../models/BudgetAdjustment";
import VoteBookAccount from "../models/VoteBookAccount";
import FiscalYear from "../models/FiscalYear";
import sequelize from "../config/database";
import { Employee } from "../models";
import { AuditEventType, AuditService } from "../services/AuditService";

export class BudgetAdjustmentController {
  static async getAdjustments(req: Request, res: Response) {
    try {
      const {
        status,
        adjustment_type,
        page = 1,
        limit = 20,
        search,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { organization_id: req?.user?.organizationId };

      // Apply filters
      if (status) where.status = status;
      if (adjustment_type) where.adjustment_type = adjustment_type;

      if (search) {
        where[Op.or] = [
          { reference_number: { [Op.like]: `%${search}%` } },
          { justification: { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows: adjustments, count: total } =
        await BudgetAdjustment.findAndCountAll({
          where,
          include: [
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
              attributes: ["id", "firstName", "lastName", "email"],
            },
            {
              model: Employee,
              as: "approver",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
          order: [["created_at", "DESC"]],
          limit: Number(limit),
          offset,
        });

      res.json({
        adjustments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get budget adjustments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getAdjustment(req: Request, res: Response) {
    try {
      const adjustment = await BudgetAdjustment.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [
          {
            model: VoteBookAccount,
            as: "fromAccount",
            attributes: [
              "id",
              "code",
              "name",
              "allocation_base",
              "sum_adjust_in",
              "sum_adjust_out",
              "sum_transfer_in",
              "sum_transfer_out",
              "committed",
              "spent",
            ],
          },
          {
            model: VoteBookAccount,
            as: "toAccount",
            attributes: [
              "id",
              "code",
              "name",
              "allocation_base",
              "sum_adjust_in",
              "sum_adjust_out",
              "sum_transfer_in",
              "sum_transfer_out",
              "committed",
              "spent",
            ],
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
      });

      if (!adjustment) {
        return res.status(404).json({ message: "Budget adjustment not found" });
      }

      res.json(adjustment);
    } catch (error) {
      console.error("Get budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async createAdjustment(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const {
        adjustment_type,
        from_account_id,
        to_account_id,
        amount,
        justification,
        effective_date,
        attachment_count = 0,
      } = req.body;

      // Validate input
      if (
        !adjustment_type ||
        !to_account_id ||
        !amount ||
        !justification ||
        !effective_date
      ) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Validate adjustment type requirements
      if (adjustment_type === "TRANSFER" && !from_account_id) {
        return res
          .status(400)
          .json({ message: "Transfer requires from_account_id" });
      }

      // Validate accounts belong to organization
      const toAccount = await VoteBookAccount.findOne({
        where: { id: to_account_id },
        include: [
          {
            model: FiscalYear,
            where: { organization_id: req?.user?.organizationId },
          },
        ],
      });

      if (!toAccount) {
        return res
          .status(404)
          .json({ message: "Destination account not found" });
      }

      let fromAccount = null;
      if (from_account_id) {
        fromAccount = await VoteBookAccount.findOne({
          where: { id: from_account_id },
          include: [
            {
              model: FiscalYear,
              where: { organization_id: req?.user?.organizationId },
            },
          ],
        });

        if (!fromAccount) {
          return res.status(404).json({ message: "Source account not found" });
        }

        // Check if source account has sufficient funds for transfer
        if (adjustment_type === "TRANSFER") {
          const availableBalance = fromAccount.calculatedAvailable;
          if (availableBalance < Number(amount)) {
            return res.status(400).json({
              message: "Insufficient funds in source account",
              available: availableBalance,
              requested: Number(amount),
            });
          }
        }
      }

      // Generate reference number
      const year = new Date().getFullYear();
      const lastAdjustment = await BudgetAdjustment.findOne({
        where: {
          organization_id: req?.user?.organizationId!,
          reference_number: {
            [Op.like]: `BA-${req?.user?.organizationId}-${year}-%`,
          },
        },
        order: [["created_at", "DESC"]],
      });

      let sequence = 1;
      if (lastAdjustment && lastAdjustment.reference_number) {
        const lastSequence = parseInt(
          lastAdjustment.reference_number.split("-")[3]
        );
        sequence = lastSequence + 1;
      }

      const reference_number = `BA-${
        req?.user?.organizationId
      }-${year}-${sequence.toString().padStart(6, "0")}`;

      // Create budget adjustment
      const adjustment = await BudgetAdjustment.create(
        {
          organization_id: req?.user?.organizationId!,
          adjustment_type,
          from_account_id,
          to_account_id,
          amount: Number(amount),
          justification,
          requestor_id: req.user!.id,
          status: "PENDING",
          effective_date: new Date(effective_date),
          reference_number,
          attachment_count,
        },
        { transaction: t }
      );

      // Log the creation
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.BUDGET_ADJUSTMENT,
        ip: req.ip,
        meta: {
          action: "create",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      // Fetch the created adjustment with includes
      const createdAdjustment = await BudgetAdjustment.findByPk(adjustment.id, {
        include: [
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
        ],
      });

      res.status(201).json(createdAdjustment);
    } catch (error) {
      await t.rollback();
      console.error("Create budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async approveAdjustment(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const { comment } = req.body;

      const adjustment = await BudgetAdjustment.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
          status: "PENDING",
        },
      });

      if (!adjustment) {
        return res.status(404).json({
          message: "Budget adjustment not found or already processed",
        });
      }

      // Update adjustment status
      await adjustment.update(
        {
          status: "APPROVED",
          approver_id: req.user!.id,
          approval_date: new Date(),
        },
        { transaction: t }
      );

      // Log the approval
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.BUDGET_ADJUSTMENT,
        ip: req.ip,
        meta: {
          action: "approval",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({
        message: "Budget adjustment approved successfully",
        adjustment,
      });
    } catch (error) {
      await t.rollback();
      console.error("Approve budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async rejectAdjustment(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const { comment } = req.body;

      const adjustment = await BudgetAdjustment.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
          status: "PENDING",
        },
      });

      if (!adjustment) {
        return res.status(404).json({
          message: "Budget adjustment not found or already processed",
        });
      }

      // Update adjustment status
      await adjustment.update(
        {
          status: "REJECTED",
          approver_id: req.user!.id,
          approval_date: new Date(),
        },
        { transaction: t }
      );

      // Log the rejection
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.BUDGET_ADJUSTMENT,
        ip: req.ip,
        meta: {
          action: "reject",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({ message: "Budget adjustment rejected successfully" });
    } catch (error) {
      await t.rollback();
      console.error("Reject budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async postAdjustment(req: Request, res: Response) {
    const t = await sequelize.transaction();

    try {
      const adjustment = await BudgetAdjustment.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
          status: "APPROVED",
        },
        include: [
          {
            model: VoteBookAccount,
            as: "fromAccount",
          },
          {
            model: VoteBookAccount,
            as: "toAccount",
          },
        ],
      });

      if (!adjustment) {
        return res
          .status(404)
          .json({ message: "Budget adjustment not found or not approved" });
      }

      const amount = Number(adjustment.amount);

      // Execute the fund movement based on adjustment type
      switch (adjustment.adjustment_type) {
        case "SUPPLEMENT":
          // Add to destination account's sum_adjust_in
          await VoteBookAccount.increment("sum_adjust_in", {
            by: amount,
            where: { id: adjustment.to_account_id },
            transaction: t,
          });
          break;

        case "REDUCTION":
          // Add to destination account's sum_adjust_out
          await VoteBookAccount.increment("sum_adjust_out", {
            by: amount,
            where: { id: adjustment.to_account_id },
            transaction: t,
          });
          break;

        case "TRANSFER":
          if (!adjustment.from_account_id) {
            throw new Error("Transfer requires source account");
          }
          // Subtract from source account's sum_transfer_out and add to destination account's sum_transfer_in
          await VoteBookAccount.increment("sum_transfer_out", {
            by: amount,
            where: { id: adjustment.from_account_id },
            transaction: t,
          });
          await VoteBookAccount.increment("sum_transfer_in", {
            by: amount,
            where: { id: adjustment.to_account_id },
            transaction: t,
          });
          break;

        case "CARRYFORWARD":
          // Add to destination account's carryover
          await VoteBookAccount.increment("carryover", {
            by: amount,
            where: { id: adjustment.to_account_id },
            transaction: t,
          });
          break;

        case "REVERSAL":
          // Reverse a previous transaction (reduce committed or spent)
          await VoteBookAccount.decrement("committed", {
            by: amount,
            where: { id: adjustment.to_account_id },
            transaction: t,
          });
          break;

        default:
          throw new Error(
            `Unknown adjustment type: ${adjustment.adjustment_type}`
          );
      }

      // Update adjustment status
      await adjustment.update(
        {
          status: "POSTED",
          posted_date: new Date(),
        },
        { transaction: t }
      );

      // Log the posting
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.BUDGET_ADJUSTMENT,
        ip: req.ip,
        meta: {
          action: "post",
        },
        userAgent: req.get("Employee-Agent"),
      });

      await t.commit();

      res.json({
        message: "Budget adjustment posted successfully",
        adjustment,
      });
    } catch (error) {
      await t.rollback();
      console.error("Post budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async simulateAdjustment(req: Request, res: Response) {
    try {
      const adjustment = await BudgetAdjustment.findOne({
        where: {
          id: req.params.id,
          organization_id: req?.user?.organizationId,
        },
        include: [
          {
            model: VoteBookAccount,
            as: "fromAccount",
          },
          {
            model: VoteBookAccount,
            as: "toAccount",
          },
        ],
      });

      if (!adjustment) {
        return res.status(404).json({ message: "Budget adjustment not found" });
      }

      const amount = Number(adjustment.amount);
      const simulation: any = {
        adjustment_type: adjustment.adjustment_type,
        amount,
        toAccount: {
          id: adjustment.toAccount.id,
          code: adjustment.toAccount.code,
          name: adjustment.toAccount.name,
          current_available: adjustment.toAccount.calculatedAvailable,
          after_available: 0,
        },
      };

      // Calculate impact based on adjustment type
      switch (adjustment.adjustment_type) {
        case "SUPPLEMENT":
        case "CARRYFORWARD":
          simulation.toAccount.after_available =
            adjustment.toAccount.calculatedAvailable + amount;
          break;

        case "REDUCTION":
          simulation.toAccount.after_available =
            adjustment.toAccount.calculatedAvailable - amount;
          break;

        case "TRANSFER":
          if (adjustment.fromAccount) {
            simulation.fromAccount = {
              id: adjustment.fromAccount.id,
              code: adjustment.fromAccount.code,
              name: adjustment.fromAccount.name,
              current_available: adjustment.fromAccount.calculatedAvailable,
              after_available:
                adjustment.fromAccount.calculatedAvailable - amount,
            };
          }
          simulation.toAccount.after_available =
            adjustment.toAccount.calculatedAvailable + amount;
          break;

        case "REVERSAL":
          simulation.toAccount.after_available =
            adjustment.toAccount.calculatedAvailable + amount;
          break;
      }

      res.json({ simulation });
    } catch (error) {
      console.error("Simulate budget adjustment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

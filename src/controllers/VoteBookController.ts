import { Response, Request } from "express";
import { Op } from "sequelize";
import VoteBookAccount from "../models/VoteBookAccount";
import FiscalYear from "../models/FiscalYear";
import { Department } from "../models/Department";
import NcoaCode from "../models/NcoaCode";
import BudgetAdjustment from "../models/BudgetAdjustment";
import Commitment from "../models/Commitment";
import Payment from "../models/Payment";
import Voucher from "../models/Voucher";
import VoucherLine from "../models/VoucherLine";
import VoteBookService from "../services/voteBookService";
import { Employee } from "../models";
import { SecurityService } from "../services/SecurityService";
import { AuditEventType, AuditService } from "../services/AuditService";

export class VoteBookController {
  static async getAccounts(req: Request, res: Response) {
    try {
      const { fiscal_year_id, department_id, account_type, search } = req.query;

      const where: any = {};

      // Always filter by organization through fiscal year
      const fiscalYears = await FiscalYear.findAll({
        where: { organization_id: req?.user?.organizationId },
        attributes: ["id"],
      });

      const fiscalYearIds = fiscalYears.map((fy) => fy.id);
      where.fiscal_year_id = { [Op.in]: fiscalYearIds };

      // Apply filters
      if (fiscal_year_id) where.fiscal_year_id = fiscal_year_id;
      if (department_id) where.department_id = department_id;
      if (account_type) where.account_type = account_type;

      if (search) {
        where[Op.or] = [
          { code: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
        ];
      }

      const accounts = await VoteBookAccount.findAll({
        where,
        include: [
          {
            model: FiscalYear,
            attributes: ["id", "year", "is_current"],
          },
          {
            model: Department,
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: VoteBookAccount,
            as: "children",
            attributes: ["id", "code", "name"],
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
              "account_type",
              "level",
              "type",
            ],
          },
        ],
        order: [["code", "ASC"]],
      });

      // Calculate balances for each account
      const accountsWithBalances = accounts.map((account) => ({
        ...account.toJSON(),
        balances: {
          allocation: account.allocation_base,
          carryover: account.carryover,
          committed: account.committed,
          spent: account.spent,
          available: account.calculatedAvailable,
        },
      }));

      res.json(accountsWithBalances);
    } catch (error) {
      console.error("Get vote book accounts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getAccount(req: Request, res: Response) {
    try {
      const account = await VoteBookAccount.findByPk(req.params.id, {
        include: [
          {
            model: FiscalYear,
            where: { organization_id: req?.user?.organizationId },
          },
          {
            model: Department,
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: VoteBookAccount,
            as: "parent",
            attributes: ["id", "code", "name"],
          },
          {
            model: VoteBookAccount,
            as: "children",
            attributes: [
              "id",
              "code",
              "name",
              "allocation_base",
              "committed",
              "spent",
            ],
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
              "account_type",
              "level",
              "type",
            ],
          },
        ],
      });

      if (!account) {
        return res.status(404).json({ message: "Vote book account not found" });
      }

      const balances = await VoteBookService.calculateBalances(account.id);

      res.json({
        ...account.toJSON(),
        balances,
      });
    } catch (error) {
      console.error("Get vote book account error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getAccountDetail(req: Request, res: Response) {
    try {
      const account = await VoteBookAccount.findByPk(req.params.id, {
        include: [
          {
            model: FiscalYear,
            where: { organization_id: req?.user?.organizationId },
          },
          {
            model: Department,
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: VoteBookAccount,
            as: "parent",
            attributes: ["id", "code", "name"],
          },
          {
            model: VoteBookAccount,
            as: "children",
            attributes: [
              "id",
              "code",
              "name",
              "allocation_base",
              "committed",
              "spent",
            ],
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
              "account_type",
              "level",
              "type",
            ],
          },
        ],
      });

      if (!account) {
        return res.status(404).json({ message: "Vote book account not found" });
      }

      const balances = await VoteBookService.calculateBalances(account.id);

      // Get budget adjustments for this account
      const budgetAdjustments = await BudgetAdjustment.findAll({
        where: {
          [Op.or]: [
            { from_account_id: account.id },
            { to_account_id: account.id },
          ],
        },
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
            attributes: ["id", "firstName", "lastName"],
          },
          {
            model: Employee,
            as: "approver",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["effective_date", "DESC"]],
      });

      // Get allocations (mock data for now - would come from allocation tracking)
      const allocations = [
        {
          id: 1,
          date: account.created_at,
          source: "Original",
          amount: account.allocation_base,
          notes: "Initial budget allocation",
          created_by: {
            firstName: "System",
            lastName: "Admin",
          },
        },
      ];

      // Get commitments
      const commitments = await Commitment.findAll({
        where: { account_id: account.id },
        include: [
          {
            model: Voucher,
            attributes: ["id", "voucher_number", "purpose", "payee_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Get expenditures (payments)
      const expenditures = await Payment.findAll({
        include: [
          {
            model: Voucher,
            attributes: ["id", "voucher_number", "purpose", "payee_name"],
            include: [
              {
                model: VoucherLine,
                where: { account_id: account.id },
                attributes: ["id", "total_amount"],
              },
            ],
          },
          {
            model: Employee,
            as: "processor",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        where: {
          status: "completed",
        },
        order: [["payment_date", "DESC"]],
      });

      // Process commitments to add remaining amounts and linked expenditures
      const processedCommitments = commitments.map((commitment) => {
        const linkedExpenditures = expenditures.filter(
          (exp) => exp.voucher_id === commitment.voucher_id
        );

        const totalExpended = linkedExpenditures.reduce(
          (sum, exp) => sum + Number(exp.amount),
          0
        );
        const remainingAmount = Number(commitment.amount) - totalExpended;

        return {
          ...commitment.toJSON(),
          remaining_amount: remainingAmount,
          expenditures: linkedExpenditures.map((exp) => ({
            id: exp.id,
            amount: Number(exp.amount),
            date: exp.payment_date,
          })),
        };
      });

      // Process expenditures to include approved_by information
      const processedExpenditures = expenditures.map((expenditure) => ({
        id: expenditure.id,
        voucher_id: expenditure.voucher_id,
        amount: Number(expenditure.amount),
        payment_date: expenditure.payment_date,
        voucher: expenditure.voucher,
        approved_by: expenditure.processor,
        cost_object: null, // Would come from voucher line or payment details
        notes: expenditure.notes,
      }));

      res.json({
        ...account.toJSON(),
        balances,
        budgetAdjustments,
        allocations,
        commitments: processedCommitments,
        expenditures: processedExpenditures,
      });
    } catch (error) {
      console.error("Get account detail error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async createAccount(req: Request, res: Response) {
    try {
      const {
        code,
        name,
        description,
        fiscal_year_id,
        department_id,
        parent_id,
        account_type,
        account_class,
        ncoa_code_id,
        allocation_base = 0,
        carryover = 0,
        soft_ceiling = false,
        hard_ceiling = true,
        approval_required = true,
      } = req.body;

      // Validate input
      if (
        !code ||
        !name ||
        !fiscal_year_id ||
        !account_type ||
        !account_class
      ) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Check for duplicate code within the same fiscal year
      const existingAccount = await VoteBookAccount.findOne({
        where: {
          code,
          fiscal_year_id,
        },
      });

      if (existingAccount) {
        return res.status(400).json({
          message: "Account code already exists for this fiscal year",
        });
      }

      const account = await VoteBookAccount.create({
        code,
        name,
        description,
        fiscal_year_id,
        department_id,
        parent_id,
        account_type,
        account_class,
        ncoa_code_id,
        allocation_base: Number(allocation_base),
        carryover: Number(carryover),
        committed: 0,
        spent: 0,
        soft_ceiling,
        hard_ceiling,
        is_frozen: false,
        is_active: true,
        approval_required,
      });

      // Log the creation
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER_BOOK_ACCOUNT,
        ip: req.ip,
        meta: {
          code: account.code,
          name: account.name,
          action: "create",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.status(201).json(account);
    } catch (error) {
      console.error("Create vote book account error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async updateAccount(req: Request, res: Response) {
    try {
      const account = await VoteBookAccount.findByPk(req.params.id, {
        include: [
          {
            model: FiscalYear,
            where: { organization_id: req?.user?.organizationId },
          },
        ],
      });

      if (!account) {
        return res.status(404).json({ message: "Vote book account not found" });
      }

      const oldValues = account.toJSON();

      await account.update(req.body);

      // Log the creation
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER_BOOK_ACCOUNT,
        ip: req.ip,
        meta: {
          code: account.code,
          name: account.name,
          action: "update",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.json(account);
    } catch (error) {
      console.error("Update vote book account error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async freezeAccount(req: Request, res: Response) {
    try {
      const { freeze = true } = req.body;

      const account = await VoteBookAccount.findByPk(req.params.id, {
        include: [
          {
            model: FiscalYear,
            where: { organization_id: req?.user?.organizationId },
          },
        ],
      });

      if (!account) {
        return res.status(404).json({ message: "Vote book account not found" });
      }

      await account.update({ is_frozen: freeze });

      // Log the creation
      await AuditService.logEvent({
        userId: req?.user?.id!,
        actorId: req.user!.id,
        eventType: AuditEventType.VOUCHER_BOOK_ACCOUNT,
        ip: req.ip,
        meta: {
          code: account.code,
          name: account.name,
          action: "Freeze",
        },
        userAgent: req.get("Employee-Agent"),
      });

      res.json({
        message: `Account ${freeze ? "frozen" : "unfrozen"} successfully`,
        account,
      });
    } catch (error) {
      console.error("Freeze/unfreeze account error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getAccountHistory(req: Request, res: Response) {
    try {
      // This would typically fetch transaction history from audit logs
      // For now, return current balances
      const balances = await VoteBookService.calculateBalances(
        Number(req.params.id)
      );

      res.json({
        current: balances,
        history: [
          // Placeholder data
          {
            date: new Date(),
            type: "current",
            ...balances,
          },
        ],
      });
    } catch (error) {
      console.error("Get account history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

import { Request, Response } from "express";
import { Op, fn, col, where as sequelizeWhere } from "sequelize";
import Payment from "../models/Payment";
import {
  Employee,
  Voucher,
  WorkflowInstanceStage,
  WorkflowRequest,
} from "../models";
import { EmailService } from "../services/EmailService";
import { WorkflowExecutionService } from "../services/WorkflowExecutionService";

export class PaymentController {
  static async getByFilter(req: Request, res: Response) {
    try {
      const { entityId } = req.body;
      const messages = await Payment.findAll({
        where: {
          entityId,
          organizationId: req.user?.organizationId,
          // member_ids JSON array must contain current user id
          [Op.and]: [
            sequelizeWhere(
              fn(
                "JSON_CONTAINS",
                col("member_ids"),
                // assuming member_ids is an array of numeric ids; wrap in array
                JSON.stringify([req?.user!.id])
              ),
              1
            ),
          ],
        },
        include: [{ model: Employee, as: "sender" }],
        order: [["createdAt", "ASC"]],
      });

      res.json({ success: true, item: messages });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch conversation",
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      //       {
      //     "paymentOption": {
      //         "id": "tsa-tetfund",
      //         "name": "Tetfund",
      //         "category": "TSA",
      //         "subGroup": "Tetfund"
      //     },
      //     "voucherIds": [
      //         26
      //     ],
      //     "stageInstanceIds": [
      //         361
      //     ]
      // }

      const payment_reference = `PAY-${Date.now()}`;

      const { paymentOption, voucherIds, stageInstanceIds } = req.body;

      for (let voucherId of voucherIds) {
        const voucher = await Voucher.findByPk(voucherId);

        const payment = await Payment.create({
          organizationId: req.user?.organizationId,
          payment_reference,
          amount: voucher?.total_amount || 0,
          entityId: voucherId,
          entityType: "voucher",
          payment_method: paymentOption.id,
          processor_id: req?.user?.id,
          status: "processed",
        });
        // Here, you might want to update the voucher status or perform other actions
        await Voucher.update(
          {
            status: "processed",
            paymentId: payment.id,
          },
          {
            where: {
              id: voucherId,
            },
          }
        );
      }

      // TODO: Link payment to workflow stage instances
      for (let stageInstanceId of stageInstanceIds) {
        const stageInstance = await WorkflowInstanceStage.findByPk(
          stageInstanceId,
          {
            include: [{ model: WorkflowRequest, as: "request" }],
          }
        );

        await WorkflowExecutionService.completeStage({
          stageId: stageInstanceId,
          ...stageInstance?.request.formResponses,
          actionUnitGroupId: payment_reference,
          action: "Approve",
          comment: `Approve payment reference: ${payment_reference}`,
          actedByUserId: req?.user?.id ?? 0,
          user: req.user,
        });
      }

      res.status(201).json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to create message",
      });
    }
  }
}

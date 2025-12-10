import { Request, Response } from "express";
import { Op, fn, col, where as sequelizeWhere } from "sequelize";
import { Message } from "../models/Message";
import { Employee } from "../models";
import { EmailService } from "../services/EmailService";

export class MessageController {
  static async getByEntityId(req: Request, res: Response) {
    try {
      const { entityId } = req.body;
      const messages = await Message.findAll({
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
      const {
        message,
        parentMessageId,
        entityId,
        receipientIds,
        receipientEmails,
        subject,
        entityType,
      } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: "senderId and body are required",
        });
      }

      const msg = await Message.create({
        organizationId: req.user?.organizationId,
        entityId,
        senderId: req?.user?.id,
        parentMessageId: parentMessageId ?? null,
        body: message,
        createdBy: req?.user?.id,
        memberIds: [...receipientIds, req?.user?.id],
        entityType,
      });

      let senderEmail = "";

      if (req?.user?.email) {
        senderEmail = req?.user?.email;
      }

      for (let email of receipientEmails) {
        await new EmailService().sendMessageEmail({
          senderName: `${req?.user?.firstName} ${req?.user?.firstName}`,
          senderEmail,
          receiverEmails: email,
          subject,
          message,
        });
      }

      res.status(201).json({ success: true, item: msg });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to create message",
      });
    }
  }
  /**
   * PUT /messages/:id
   * body: { body? }
   */
  static async edit(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { body } = req.body;

      const msg = await Message.findByPk(id);
      if (!msg) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      if (body !== undefined) msg.body = body;
      await msg.save();

      res.json({ success: true, item: msg });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to update message",
      });
    }
  }

  /**
   * DELETE /messages/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const msg = await Message.findByPk(id);
      if (!msg) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found" });
      }

      // Optionally delete its replies, or enforce ON DELETE CASCADE
      await Message.destroy({ where: { parentMessageId: id } });
      await msg.destroy();

      res.json({ success: true, message: "Message deleted" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to delete message",
      });
    }
  }
}

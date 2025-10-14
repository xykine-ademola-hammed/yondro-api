import { Response, Request } from "express";
import { Op } from "sequelize";
import NcoaCode from "../models/NcoaCode";

export class NcoaController {
  static async getCodes(req: Request, res: Response) {
    try {
      const {
        search,
        economic_type,
        account_type,
        level,
        type,
        page = 1,
        limit = 50,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { is_active: true };

      // Apply filters
      if (economic_type) where.economic_type = economic_type;
      if (account_type) where.account_type = account_type;
      if (level) where.level = Number(level);
      if (type) where.type = type;

      if (search) {
        where[Op.or] = [
          { code: { [Op.like]: `%${search}%` } },
          { fg_title: { [Op.like]: `%${search}%` } },
          { state_title: { [Op.like]: `%${search}%` } },
          { lg_title: { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows: codes, count: total } = await NcoaCode.findAndCountAll({
        where,
        order: [["code", "ASC"]],
        limit: Number(limit),
        offset,
      });

      res.json({
        codes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get NCOA codes error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getCode(req: Request, res: Response) {
    try {
      const ncoaCode = await NcoaCode.findOne({
        where: {
          code: req.params.code,
          is_active: true,
        },
      });

      if (!ncoaCode) {
        return res.status(404).json({ message: "NCOA code not found" });
      }

      res.json(ncoaCode);
    } catch (error) {
      console.error("Get NCOA code error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getHierarchy(req: Request, res: Response) {
    try {
      const level = Number(req.params.level);

      if (level < 1 || level > 5) {
        return res
          .status(400)
          .json({ message: "Level must be between 1 and 5" });
      }

      const codes = await NcoaCode.findAll({
        where: {
          level,
          is_active: true,
        },
        order: [["code", "ASC"]],
      });

      res.json(codes);
    } catch (error) {
      console.error("Get NCOA hierarchy error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getByType(req: Request, res: Response) {
    try {
      const codes = await NcoaCode.findAll({
        where: {
          economic_type: req.params.economicType,
          is_active: true,
        },
        order: [
          ["level", "ASC"],
          ["code", "ASC"],
        ],
      });

      res.json(codes);
    } catch (error) {
      console.error("Get NCOA codes by type error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const [totalCodes, byEconomicType, byLevel, byAccountType] =
        await Promise.all([
          NcoaCode.count({ where: { is_active: true } }),

          NcoaCode.findAll({
            attributes: [
              "economic_type",
              [
                NcoaCode.sequelize!.fn("COUNT", NcoaCode.sequelize!.col("id")),
                "count",
              ],
            ],
            where: { is_active: true },
            group: ["economic_type"],
            raw: true,
          }),

          NcoaCode.findAll({
            attributes: [
              "level",
              [
                NcoaCode.sequelize!.fn("COUNT", NcoaCode.sequelize!.col("id")),
                "count",
              ],
            ],
            where: { is_active: true },
            group: ["level"],
            order: [["level", "ASC"]],
            raw: true,
          }),

          NcoaCode.findAll({
            attributes: [
              "account_type",
              [
                NcoaCode.sequelize!.fn("COUNT", NcoaCode.sequelize!.col("id")),
                "count",
              ],
            ],
            where: {
              is_active: true,
              account_type: { [Op.ne]: "" },
            },
            group: ["account_type"],
            raw: true,
          }),
        ]);

      res.json({
        totalCodes,
        byEconomicType,
        byLevel,
        byAccountType,
      });
    } catch (error) {
      console.error("Get NCOA stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

import { Model, ModelCtor, WhereOptions, FindOptions, Op } from "sequelize";
import { PaginationOptions, PaginatedResponse } from "../types";
import { Stage } from "../models";

export class BaseService<T extends Model> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  async create(data: any): Promise<T | undefined> {
    try {
      return await this.model.create(data, { include: [Stage] });
    } catch (error) {
      console.log(error);
    }
  }

  async findById(id: number, options?: FindOptions): Promise<T | null> {
    return await this.model.findByPk(id, options);
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    return await this.model.findAll(options);
  }

  async findWithPagination(
    options: PaginationOptions & {
      where?: WhereOptions;
      include?: any[];
      orderby?: any[];
    }
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = 10,
      search,
      where = {},
      include = [],
      orderby = [["createdAt", "DESC"]],
    } = options;
    const offset = (page - 1) * limit;

    // Add search functionality if provided
    let searchWhere = where;
    if (search) {
      // This is a generic search implementation
      // Override in specific services for custom search logic
      searchWhere = {
        ...where,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where: searchWhere,
      include,
      limit,
      offset,
      order: orderby,
    });

    return {
      rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async update(id: number, data: any): Promise<T | null> {
    const [affectedCount] = await this.model.update(data, {
      where: { id } as any,
    });

    if (affectedCount === 0) {
      return null;
    }

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const affectedCount = await this.model.destroy({
      where: { id } as any,
    });

    return affectedCount > 0;
  }
}

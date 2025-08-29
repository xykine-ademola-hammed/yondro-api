"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
class BaseService {
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        try {
            return await this.model.create(data, { include: [models_1.Stage] });
        }
        catch (error) {
            console.log(error);
        }
    }
    async createOnly(data) {
        try {
            return await this.model.create(data);
        }
        catch (error) {
            console.log(error);
        }
    }
    async findById(id, options) {
        return await this.model.findByPk(id, options);
    }
    async findAll(options) {
        return await this.model.findAll(options);
    }
    async findWithPagination(options) {
        const { page = 1, limit = 10, search, where = {}, include = [], orderby = [["createdAt", "DESC"]], } = options;
        const offset = (page - 1) * limit;
        let searchWhere = where;
        if (search) {
            searchWhere = {
                ...where,
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.like]: `%${search}%` } },
                    { description: { [sequelize_1.Op.like]: `%${search}%` } },
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
    async update(id, data) {
        const [affectedCount] = await this.model.update(data, {
            where: { id },
        });
        if (affectedCount === 0) {
            return null;
        }
        return await this.findById(id);
    }
    async delete(id) {
        const affectedCount = await this.model.destroy({
            where: { id },
        });
        return affectedCount > 0;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=BaseService.js.map
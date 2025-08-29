"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQueryWithIncludes = exports.buildWhereClause = void 0;
exports.buildWhere = buildWhere;
const sequelize_1 = require("sequelize");
const type_1 = require("./type");
const buildWhereClause = (filters) => {
    const where = {};
    for (const filter of filters) {
        const { key, value, condition } = filter;
        if ((condition === "and" || condition === "or") && Array.isArray(value)) {
            const nestedClauses = value
                .filter((v) => typeof v === "object" && v !== null && "condition" in v)
                .map((f) => (0, exports.buildWhereClause)([f]));
            const opSymbol = sequelize_1.Op[condition];
            if (!(opSymbol in where)) {
                where[opSymbol] = [];
            }
            where[opSymbol].push(...nestedClauses);
            continue;
        }
        if (!key || value === undefined || value === null)
            continue;
        const setCondition = (op, val) => {
            if (!where[key])
                where[key] = {};
            Object.assign(where[key], { [op]: val });
        };
        switch (condition) {
            case "equal":
                where[key] = value;
                break;
            case "not":
                setCondition(sequelize_1.Op.not, value);
                break;
            case "gt":
                setCondition(sequelize_1.Op.gt, value);
                break;
            case "lt":
                setCondition(sequelize_1.Op.lt, value);
                break;
            case "between":
                if (Array.isArray(value) && value.length === 2) {
                    setCondition(sequelize_1.Op.between, value);
                }
                break;
            case "startWith":
                setCondition(sequelize_1.Op.like, `${value}%`);
                break;
            case "endWith":
                setCondition(sequelize_1.Op.like, `%${value}`);
                break;
            case "contains":
            case "like":
                setCondition(sequelize_1.Op.like, `%${value}%`);
                break;
            case "in":
                const arrayVal = Array.isArray(value) ? value : [value];
                setCondition(sequelize_1.Op.in, arrayVal);
                break;
            case "json-contains":
                const clause = (0, sequelize_1.where)((0, sequelize_1.fn)("JSON_CONTAINS", (0, sequelize_1.col)(key), JSON.stringify(value)), true);
                if (!where[sequelize_1.Op.and])
                    where[sequelize_1.Op.and] = [];
                where[sequelize_1.Op.and].push(clause);
                break;
        }
    }
    return where;
};
exports.buildWhereClause = buildWhereClause;
const ConditionSymbolMap = {
    equal: sequelize_1.Op.eq,
    not: sequelize_1.Op.not,
    gt: sequelize_1.Op.gt,
    lt: sequelize_1.Op.lt,
    between: sequelize_1.Op.between,
    startWith: sequelize_1.Op.like,
    endWith: sequelize_1.Op.like,
    contains: sequelize_1.Op.like,
    like: sequelize_1.Op.like,
    in: sequelize_1.Op.in,
    and: undefined,
    or: undefined,
    "json-contains": undefined,
};
function buildWhere(filter) {
    if (Array.isArray(filter)) {
        return buildWhere(filter[0]);
    }
    if (filter.condition === "and" || filter.condition === "or") {
        const operator = filter.condition === "and" ? sequelize_1.Op.and : sequelize_1.Op.or;
        return {
            [operator]: filter.value.map((item) => buildWhere(item)),
        };
    }
    if (filter.key && filter.value !== undefined && filter.condition) {
        const keys = filter.key.split(".");
        let whereClause = filter.value;
        if (keys.length > 1) {
            whereClause = { [keys.slice(1).join(".")]: filter.value };
        }
        const op = ConditionSymbolMap[filter.condition];
        if (op) {
            return {
                [keys[0]]: { [op]: whereClause },
            };
        }
        if (filter.condition === "equal") {
            return { [keys[0]]: whereClause };
        }
        throw new Error(`Unsupported filter condition for buildWhere: ${filter.condition}`);
    }
    throw new Error("Invalid filter structure");
}
const buildQueryWithIncludes = (filters, baseModel) => {
    const where = {};
    const includeMap = {};
    for (const filter of filters) {
        const { key, value, condition } = filter;
        if (!key || value === undefined || value === null)
            continue;
        const parts = key.split(".");
        if (parts.length === 1) {
            Object.assign(where, buildSimpleWhere(key, value, condition));
        }
        else {
            const topModelKey = parts[0];
            const initialModel = type_1.modelMap[topModelKey];
            if (!initialModel) {
                throw new Error(`Model mapping not found for top-level relation "${topModelKey}". Please add it to modelMap.`);
            }
            let currentInclude = includeMap[topModelKey] || {
                model: initialModel,
            };
            let cursor = currentInclude;
            for (let i = 1; i < parts.length - 1; i++) {
                const nextModelKey = parts[i];
                const nextModel = type_1.modelMap[nextModelKey];
                if (!nextModel) {
                    throw new Error(`Model mapping not found for nested relation "${nextModelKey}" (in key: "${key}"). Please add it to modelMap.`);
                }
                let nextInclude;
                if (cursor.include) {
                    nextInclude = cursor.include.find((inc) => inc.model === nextModel);
                }
                if (!nextInclude) {
                    nextInclude = { model: nextModel };
                    cursor.include = cursor.include
                        ? [...cursor.include, nextInclude]
                        : [nextInclude];
                }
                cursor = nextInclude;
            }
            const finalKey = parts[parts.length - 1];
            cursor.where = {
                ...(cursor.where || {}),
                ...buildSimpleWhere(finalKey, value, condition),
            };
            includeMap[topModelKey] = currentInclude;
        }
    }
    return {
        where,
        include: Object.values(includeMap),
    };
};
exports.buildQueryWithIncludes = buildQueryWithIncludes;
function buildSimpleWhere(key, value, condition) {
    switch (condition) {
        case "equal":
            return { [key]: value };
        case "not":
            return { [key]: { [sequelize_1.Op.not]: value } };
        case "gt":
            return { [key]: { [sequelize_1.Op.gt]: value } };
        case "lt":
            return { [key]: { [sequelize_1.Op.lt]: value } };
        case "between":
            return { [key]: { [sequelize_1.Op.between]: value } };
        case "startWith":
            return { [key]: { [sequelize_1.Op.like]: `${value}%` } };
        case "endWith":
            return { [key]: { [sequelize_1.Op.like]: `%${value}` } };
        case "contains":
        case "like":
            return { [key]: { [sequelize_1.Op.like]: `%${value}%` } };
        case "in":
            return { [key]: { [sequelize_1.Op.in]: value } };
        default:
            return {};
    }
}
function deepMergeIncludes(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    const merged = { ...a };
    if (a.include && b.include) {
        const map = {};
        [...a.include, ...b.include].forEach((inc) => {
            const key = inc.model.name;
            map[key] = deepMergeIncludes(map[key], inc);
        });
        merged.include = Object.values(map);
    }
    else if (b.include) {
        merged.include = b.include;
    }
    merged.where = { ...(a.where || {}), ...(b.where || {}) };
    return merged;
}
//# sourceMappingURL=filterWhereBuilder.js.map
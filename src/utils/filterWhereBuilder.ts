import {
  Op,
  WhereOptions,
  IncludeOptions,
  ModelStatic,
  fn,
  col,
  where as whereFn,
} from "sequelize";
import { modelMap } from "./type";

interface ClauseResult {
  where: WhereOptions;
  include: IncludeOptions[];
}

export interface Filter {
  key?: string;
  value:
    | string
    | number
    | number[]
    | [number, number]
    | null
    | undefined
    | Filter[];
  condition:
    | "equal"
    | "not"
    | "gt"
    | "lt"
    | "between"
    | "startWith"
    | "endWith"
    | "contains"
    | "like"
    | "in"
    | "and"
    | "or"
    | "json-contains";
}

export const buildWhereClause = (filters: Filter[]): WhereOptions => {
  const where: Record<string | symbol, any> = {};

  for (const filter of filters) {
    const { key, value, condition } = filter;

    // Nested logic (AND/OR)
    if ((condition === "and" || condition === "or") && Array.isArray(value)) {
      const nestedClauses = value
        .filter(
          (v): v is Filter =>
            typeof v === "object" && v !== null && "condition" in v
        )
        .map((f) => buildWhereClause([f]));

      const opSymbol = Op[condition];
      if (!(opSymbol in where)) {
        (where as any)[opSymbol] = [];
      }

      ((where as any)[opSymbol] as WhereOptions[]).push(...nestedClauses);
      continue;
    }

    // Skip incomplete filters
    if (!key || value === undefined || value === null) continue;

    // Handle standard conditions
    const setCondition = (op: symbol, val: any) => {
      if (!where[key]) where[key] = {};
      Object.assign(where[key], { [op]: val });
    };

    switch (condition) {
      case "equal":
        where[key] = value;
        break;
      case "not":
        setCondition(Op.not, value);
        break;
      case "gt":
        setCondition(Op.gt, value);
        break;
      case "lt":
        setCondition(Op.lt, value);
        break;
      case "between":
        if (Array.isArray(value) && value.length === 2) {
          setCondition(Op.between, value);
        }
        break;
      case "startWith":
        setCondition(Op.like, `${value}%`);
        break;
      case "endWith":
        setCondition(Op.like, `%${value}`);
        break;
      case "contains":
      case "like":
        setCondition(Op.like, `%${value}%`);
        break;
      case "in":
        const arrayVal = Array.isArray(value) ? value : [value];
        setCondition(Op.in, arrayVal);
        break;

      // JSON_CONTAINS
      case "json-contains":
        // This is outside the `where[key]` pattern; append directly to `Op.and` or `Op.or`
        const clause = whereFn(
          fn("JSON_CONTAINS", col(key), JSON.stringify(value)),
          true
        );

        if (!where[Op.and]) where[Op.and] = [];
        (where[Op.and] as WhereOptions[]).push(clause);
        break;
    }
  }
  return where;
};

/**
 * Type-safe mapping from human condition string to Sequelize Op symbol
 */
const ConditionSymbolMap: Record<Filter["condition"], symbol | undefined> = {
  equal: Op.eq,
  not: Op.not,
  gt: Op.gt,
  lt: Op.lt,
  between: Op.between,
  startWith: Op.like,
  endWith: Op.like,
  contains: Op.like,
  like: Op.like,
  in: Op.in,
  and: undefined,
  or: undefined,
  "json-contains": undefined,
};

export function buildWhere(filter: any) {
  // If filter is an array, process the first element (assuming single top-level condition)
  if (Array.isArray(filter)) {
    return buildWhere(filter[0]);
  }

  // Handle condition objects (AND/OR)
  if (filter.condition === "and" || filter.condition === "or") {
    const operator = filter.condition === "and" ? Op.and : Op.or;
    return {
      [operator]: filter.value.map((item: any) => buildWhere(item)),
    };
  }

  // Handle comparison conditions
  if (filter.key && filter.value !== undefined && filter.condition) {
    // Handle dot notation for nested fields
    const keys = filter.key.split(".");
    let whereClause = filter.value;

    // For multi-level keys, assign the last part as the field
    if (keys.length > 1) {
      // Returns { [field]: value }
      whereClause = { [keys.slice(1).join(".")]: filter.value };
    }

    const op = ConditionSymbolMap[filter.condition as Filter["condition"]];
    if (op) {
      return {
        [keys[0]]: { [op]: whereClause },
      };
    }
    if (filter.condition === "equal") {
      return { [keys[0]]: whereClause };
    }
    throw new Error(
      `Unsupported filter condition for buildWhere: ${filter.condition}`
    );
  }

  throw new Error("Invalid filter structure");
}

// ... other utility imports remain unchanged

// Assuming modelMap, buildSimpleWhere, Filter, ClauseResult are defined elsewhere

export const buildQueryWithIncludes = (
  filters: Filter[],
  baseModel?: ModelStatic<any>
): ClauseResult => {
  const where: WhereOptions = {};
  const includeMap: Record<string, IncludeOptions> = {};

  for (const filter of filters) {
    const { key, value, condition } = filter;

    if (!key || value === undefined || value === null) continue;

    const parts = key.split(".");
    if (parts.length === 1) {
      // Direct field
      Object.assign(where, buildSimpleWhere(key, value, condition));
    } else {
      // Nested: e.g., department.organization.type
      const topModelKey = parts[0];
      console.log("==========1=====");
      const initialModel = modelMap[topModelKey];
      if (!initialModel) {
        throw new Error(
          `Model mapping not found for top-level relation "${topModelKey}". Please add it to modelMap.`
        );
      }
      let currentInclude: IncludeOptions = includeMap[topModelKey] || {
        model: initialModel,
      };
      let cursor = currentInclude;

      // Traverse nested includes
      for (let i = 1; i < parts.length - 1; i++) {
        const nextModelKey = parts[i];
        const nextModel = modelMap[nextModelKey];
        if (!nextModel) {
          throw new Error(
            `Model mapping not found for nested relation "${nextModelKey}" (in key: "${key}"). Please add it to modelMap.`
          );
        }
        let nextInclude: IncludeOptions | undefined;

        // If already exists, reuse it
        if (cursor.include) {
          nextInclude = (cursor.include as IncludeOptions[]).find(
            (inc) => (inc as any).model === nextModel
          );
        }

        if (!nextInclude) {
          nextInclude = { model: nextModel };
          cursor.include = cursor.include
            ? [...(cursor.include as IncludeOptions[]), nextInclude]
            : [nextInclude];
        }

        cursor = nextInclude;
      }

      // Final field filter
      const finalKey = parts[parts.length - 1];
      cursor.where = {
        ...(cursor.where || {}),
        ...buildSimpleWhere(finalKey, value, condition),
      };

      // Save back to includeMap
      includeMap[topModelKey] = currentInclude;
    }
  }

  // Propagate required: true for includes with filters to ensure main query filtering
  const setRequiredForFilters = (inc: IncludeOptions): boolean => {
    let needsRequired = !!(
      inc.where && Object.keys(inc.where || {}).length > 0
    );

    if (inc.include) {
      (inc.include as IncludeOptions[]).forEach((child: IncludeOptions) => {
        if (setRequiredForFilters(child)) {
          needsRequired = true;
        }
      });
    }

    if (needsRequired) {
      inc.required = true;
    }

    return needsRequired;
  };

  Object.values(includeMap).forEach(setRequiredForFilters);

  return {
    where,
    include: Object.values(includeMap),
  };
};

function buildSimpleWhere(
  key: string,
  value: any,
  condition: string
): WhereOptions {
  switch (condition) {
    case "equal":
      return { [key]: value };
    case "not":
      return { [key]: { [Op.not]: value } };
    case "gt":
      return { [key]: { [Op.gt]: value } };
    case "lt":
      return { [key]: { [Op.lt]: value } };
    case "between":
      return { [key]: { [Op.between]: value } };
    case "startWith":
      return { [key]: { [Op.like]: `${value}%` } };
    case "endWith":
      return { [key]: { [Op.like]: `%${value}` } };
    case "contains":
    case "like":
      return { [key]: { [Op.like]: `%${value}%` } };
    case "in":
      return { [key]: { [Op.in]: value } };
    default:
      return {};
  }
}

// (Examples and comments remain unchanged)

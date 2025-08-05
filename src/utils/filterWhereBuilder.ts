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

    // ✅ Nested logic (AND/OR)
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

    // ✅ Skip incomplete filters
    if (!key || value === undefined || value === null) continue;

    // ✅ Handle standard conditions
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

      // ✅ Special case: JSON_CONTAINS
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
      let currentInclude: IncludeOptions = { model: modelMap[parts[0]] };
      let cursor = currentInclude;

      for (let i = 1; i < parts.length - 1; i++) {
        const nextModel = modelMap[parts[i]];
        const nestedInclude = { model: nextModel };
        cursor.include = [nestedInclude];
        cursor = nestedInclude;
      }

      // Final field filter
      const finalKey = parts[parts.length - 1];
      cursor.where = buildSimpleWhere(finalKey, value, condition);

      includeMap[parts[0]] = deepMergeIncludes(
        includeMap[parts[0]],
        currentInclude
      );
    }
  }

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

function deepMergeIncludes(
  a?: IncludeOptions,
  b?: IncludeOptions
): IncludeOptions {
  if (!a) return b!;
  if (!b) return a;

  const merged: IncludeOptions = { ...a };

  if (a.include && b.include) {
    const map: Record<string, IncludeOptions> = {};

    [...a.include, ...b.include].forEach((inc) => {
      const key = (inc as any).model.name;
      map[key] = deepMergeIncludes(map[key], inc as IncludeOptions);
    });

    merged.include = Object.values(map);
  } else if (b.include) {
    merged.include = b.include;
  }

  merged.where = { ...(a.where || {}), ...(b.where || {}) };
  return merged;
}

// Example for buildWhereClause

// const filters: Filter[] = [
//     {
//       condition: "and",
//       value: [
//         { key: "name", value: "ham", condition: "contains" },
//         { key: "status", value: ["active", "pending"], condition: "in" },
//         {
//           condition: "or",
//           value: [
//             { key: "createdAt", value: ["2023-01-01", "2023-12-31"], condition: "between" },
//             { key: "email", value: "%@company.com", condition: "like" }
//           ]
//         }
//       ]
//     }
//   ];

// Example Usage buildQueryWithIncludes
// const filters: Filter[] = [
//     { key: 'status', value: 'active', condition: 'equal' },
//     { key: 'department.name', value: 'Engineering', condition: 'contains' },
//     { key: 'department.organization.type', value: 'Public', condition: 'equal' }
//   ];

//   const { where, include } = buildQueryWithIncludes(filters, Employee);

//   const employees = await Employee.findAll({ where, include });

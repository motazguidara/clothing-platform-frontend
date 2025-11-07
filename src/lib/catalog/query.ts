type Primitive = string | number | boolean;
type PrimitiveOrList = Primitive | Primitive[];

export type CatalogQueryInput = Record<string, unknown>;

const normalizePrimitive = (value: unknown): Primitive | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return undefined;
};

const normalizePrimitiveArray = (value: unknown): Primitive[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const normalized: Primitive[] = [];
  for (const entry of value) {
    const primitive = normalizePrimitive(entry);
    if (primitive !== undefined) {
      normalized.push(primitive);
    }
  }
  return normalized;
};

export function prepareCatalogQueryParams(
  params?: CatalogQueryInput,
): Record<string, PrimitiveOrList> {
  if (!params) {
    return {};
  }

  const prepared: Record<string, PrimitiveOrList> = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (key === "limit") {
      const numeric = Number(rawValue);
      if (Number.isFinite(numeric)) {
        prepared["page_size"] = numeric;
      }
      continue;
    }

    const normalizedArray = normalizePrimitiveArray(rawValue);
    if (normalizedArray.length > 0) {
      prepared[key] = normalizedArray;
      continue;
    }

    const normalizedValue = normalizePrimitive(rawValue);
    if (normalizedValue !== undefined) {
      prepared[key] = normalizedValue;
      continue;
    }
  }

  return prepared;
}

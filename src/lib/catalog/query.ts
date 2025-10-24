type Primitive = string | number | boolean;

export type CatalogQueryInput = Record<string, unknown>;

export function prepareCatalogQueryParams(params?: CatalogQueryInput): Record<string, Primitive> {
  if (!params) {
    return {};
  }

  const prepared: Record<string, Primitive> = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (key === "limit") {
      const numeric = Number(rawValue);
      if (Number.isFinite(numeric)) {
        prepared.page_size = numeric;
      }
      continue;
    }

    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) {
        continue;
      }
      const last = rawValue[rawValue.length - 1];
      if (typeof last === "string" || typeof last === "number" || typeof last === "boolean") {
        prepared[key] = last;
      } else {
        prepared[key] = String(last);
      }
      continue;
    }

    if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      prepared[key] = rawValue;
      continue;
    }

    prepared[key] = String(rawValue);
  }

  return prepared;
}

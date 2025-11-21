import type { CatalogFilterGroup } from "@/types";

const genderOptions = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
  { value: "unisex", label: "Unisex" },
];

const pricePresets = [
  { value: "under_150", label: "Under 150 TND", min: null, max: 150 },
  { value: "150_to_300", label: "150 - 300 TND", min: 150, max: 300 },
  { value: "300_to_600", label: "300 - 600 TND", min: 300, max: 600 },
  { value: "600_plus", label: "600 TND+", min: 600, max: null },
];

const defaultSizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const kidsGirlsSizes = ["2T", "3T", "4", "5", "6", "6X", "7", "8", "10", "12", "14", "16"];
const kidsBoysSizes = ["2T", "3T", "4", "5", "6", "7", "8", "10", "12", "14", "16", "18"];
const kidsUnisexSizes = Array.from(new Set([...kidsGirlsSizes, ...kidsBoysSizes]));

const mapSizes = (values: string[]) =>
  values.map((value) => ({
    value,
    label: value,
  }));

const adultSizeOptions = mapSizes(defaultSizeOptions);
const kidsGirlsSizeOptions = mapSizes(kidsGirlsSizes);
const kidsBoysSizeOptions = mapSizes(kidsBoysSizes);
const kidsUnisexSizeOptions = mapSizes(kidsUnisexSizes);

const colorOptions = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "beige", label: "Beige" },
  { value: "brown", label: "Brown" },
];

const truthyValues = new Set(["1", "true", "True", "yes", "on"]);

const parseActiveValue = (value?: string) => {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};

export interface BuildDefaultFiltersOptions {
  gender?: string;
  category?: string | string[];
  price_min?: string;
  price_max?: string;
  size?: string | string[];
  color?: string | string[];
  brand?: string | string[];
  sale?: string;
  in_stock?: string;
}

const toSelectedArray = (value?: string | string[]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? [trimmed] : [];
};

const normalizeCategory = (value?: string | string[]): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [first] = value;
    return first ? first.toLowerCase() : null;
  }
  return value.toLowerCase();
};

const getSizeOptionsForFilters = (options: BuildDefaultFiltersOptions) => {
  if (options.gender === "kids") {
    const category = normalizeCategory(options.category) ?? "";
    if (category.includes("girl")) {
      return kidsGirlsSizeOptions;
    }
    if (category.includes("boy")) {
      return kidsBoysSizeOptions;
    }
    return kidsUnisexSizeOptions;
  }
  return adultSizeOptions;
};

export function buildDefaultFilters(
  options: BuildDefaultFiltersOptions,
): CatalogFilterGroup[] {
  const activeMin = parseActiveValue(options.price_min);
  const activeMax = parseActiveValue(options.price_max);
  const resolvedSizeOptions = getSizeOptionsForFilters(options);

  return [
    {
      id: "gender",
      label: "Gender",
      param: "gender",
      selection: "single",
      options: genderOptions,
      selected: options.gender ? [options.gender] : [],
    },
    {
      id: "price",
      label: "Shop By Price",
      param: "price",
      selection: "range",
      options: pricePresets,
      range: {
        min: null,
        max: null,
        avg: null,
        active_min: activeMin,
        active_max: activeMax,
      },
    },
    {
      id: "sale",
      label: "Sale & Offers",
      param: "sale",
      selection: "toggle",
      options: [
        {
          value: "1",
          label: "On Sale",
        },
      ],
      selected: truthyValues.has(options.sale ?? "") ? ["1"] : [],
    },
    {
      id: "availability",
      label: "Availability",
      param: "in_stock",
      selection: "toggle",
      options: [
        {
          value: "1",
          label: "In Stock",
        },
      ],
      selected: truthyValues.has(options.in_stock ?? "") ? ["1"] : [],
    },
    {
      id: "size",
      label: "Size",
      param: "size",
      selection: "multi",
      options: resolvedSizeOptions,
      selected: toSelectedArray(options.size),
    },
    {
      id: "color",
      label: "Colour",
      param: "color",
      selection: "multi",
      options: colorOptions,
      selected: toSelectedArray(options.color),
    },
  ];
}

export type QuickFilterLink = {
  label: string;
  href: string;
};

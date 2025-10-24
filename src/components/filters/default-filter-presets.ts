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

const sizeOptions = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
].map((value) => ({ value, label: value }));

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

interface BuildDefaultFiltersOptions {
  gender?: string;
  price_min?: string;
  price_max?: string;
  size?: string;
  color?: string;
  sale?: string;
  in_stock?: string;
}

export function buildDefaultFilters(options: BuildDefaultFiltersOptions): CatalogFilterGroup[] {
  const activeMin = parseActiveValue(options.price_min);
  const activeMax = parseActiveValue(options.price_max);

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
      selection: "single",
      options: sizeOptions,
      selected: options.size ? [options.size] : [],
    },
    {
      id: "color",
      label: "Colour",
      param: "color",
      selection: "single",
      options: colorOptions,
      selected: options.color ? [options.color] : [],
    },
  ];
}

export type QuickFilterLink = {
  label: string;
  href: string;
};

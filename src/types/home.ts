export type HomeHero = {
  headline: string;
  subheadline?: string | null;
  bg_image?: string | null;
  primary_cta_label?: string | null;
  primary_cta_href?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_href?: string | null;
};

export type HomePromotion = {
  title: string;
  subtitle?: string | null;
  image?: string | null;
  href: string;
  badge?: string | null;
};

export type CategoryCard = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
};

export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
};

export type HomePayload = {
  hero: HomeHero | null;
  promotions: HomePromotion[];
  featured_categories: CategoryCard[];
  bestsellers: ProductCard[];
  new_arrivals: ProductCard[];
};

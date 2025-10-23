export type NavigationBadgeVariant = 'default' | 'new' | 'sale' | 'trend' | 'info';

export interface NavigationMenuItem {
  id: number;
  label: string;
  url: string;
  category_slug: string | null;
  badge_text?: string | null;
  badge_variant: NavigationBadgeVariant;
}

export interface NavigationMenu {
  id: number;
  key: string;
  title: string;
  order: number;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_link?: string | null;
  hero_image?: string | null;
  entry_url: string;
  hero_links?: Array<{
    href: string;
    label: string;
    badge_text?: string | null;
    badge_variant?: NavigationBadgeVariant;
  }>;
  items: NavigationMenuItem[];
}

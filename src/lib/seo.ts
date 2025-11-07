// SEO and accessibility utilities

import type { Metadata } from "next/types";

const getNonEmptyString = (
  value: string | null | undefined,
  fallback: string,
): string => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  price?: number;
  currency?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  brand?: string;
  category?: string;
  sku?: string;
}

type ProductStructuredDataInput = {
  name: string;
  description: string;
  images?: string[];
  brand?: string;
  price?: number;
  currency?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  rating?: { average: number; count: number };
  sku?: string;
  category?: string;
};

type OrganizationStructuredDataInput = {
  url?: string;
  logo?: string;
  sameAs?: string[];
};

type BreadcrumbStructuredDataInput = {
  items: Array<{ name: string; url: string }>;
};

type StructuredDataInputMap = {
  product: ProductStructuredDataInput;
  organization: OrganizationStructuredDataInput;
  breadcrumb: BreadcrumbStructuredDataInput;
};

export class SEOManager {
  private static baseUrl = (() => {
    if (typeof process !== "undefined" && process.env) {
      const envValue = process.env["NEXT_PUBLIC_BASE_URL"];
      if (typeof envValue === "string") {
        const trimmed = envValue.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
    return "https://clothing-platform.com";
  })();
  private static siteName = "Clothing Platform";
  private static defaultImage = "/images/og-default.jpg";

  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      canonical,
      ogImage,
      ogType = "website",
      price,
      currency = "TND",
      availability,
      brand,
      category,
      sku,
    } = config;

    const metadata: Metadata = {
      title: `${title} | ${SEOManager.siteName}`,
      description,
      keywords: keywords.join(", "),
      metadataBase: new URL(SEOManager.baseUrl),
      ...(canonical ? { alternates: { canonical } } : {}),
      openGraph: {
        title,
        description,
        url: canonical ?? SEOManager.baseUrl,
        siteName: SEOManager.siteName,
        images: [
          {
            url: getNonEmptyString(ogImage, SEOManager.defaultImage),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: ogType,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [getNonEmptyString(ogImage, SEOManager.defaultImage)],
      },
    };

    // Add product-specific metadata
    const hasProductMetadata =
      typeof price === "number" ||
      (typeof brand === "string" && brand.trim().length > 0) ||
      (typeof category === "string" && category.trim().length > 0) ||
      (typeof sku === "string" && sku.trim().length > 0);

    if (ogType === "website" && hasProductMetadata) {
      const other: Record<string, string> = {};

      if (typeof price === "number") {
        other["product:price:amount"] = price.toString();
      }
      const resolvedCurrency = getNonEmptyString(currency, "");
      if (resolvedCurrency) {
        other["product:price:currency"] = resolvedCurrency;
      }
      if (availability) {
        other["product:availability"] = availability;
      }
      if (brand && brand.trim().length > 0) {
        other["product:brand"] = brand.trim();
      }
      if (category && category.trim().length > 0) {
        other["product:category"] = category.trim();
      }
      if (sku && sku.trim().length > 0) {
        other["product:retailer_item_id"] = sku.trim();
      }

      if (Object.keys(other).length > 0) {
        metadata.other = other;
      }
    }

    return metadata;
  }

  static generateStructuredData<T extends keyof StructuredDataInputMap>(
    type: T,
    data: StructuredDataInputMap[T],
  ) {
    switch (type) {
      case "product": {
        const productData = data as ProductStructuredDataInput;
        const imageUrls = Array.isArray(productData.images)
          ? productData.images
              .map((img) => getNonEmptyString(img, ""))
              .filter((img) => img.length > 0)
              .map((img) =>
                img.startsWith("http")
                  ? img
                  : `${this.baseUrl}${img.startsWith("/") ? img : `/${img}`}`,
              )
          : undefined;

        const availabilityMap: Record<
          NonNullable<ProductStructuredDataInput["availability"]>,
          string
        > = {
          in_stock: "InStock",
          out_of_stock: "OutOfStock",
          preorder: "PreOrder",
        };
        const availabilityKey = productData.availability ?? "in_stock";

        const offers: Record<string, unknown> = {
          "@type": "Offer",
          seller: {
            "@type": "Organization",
            name: this.siteName,
          },
          availability: `https://schema.org/${availabilityMap[availabilityKey] ?? "InStock"}`,
        };

        if (typeof productData.price === "number") {
          offers["price"] = productData.price;
        }
        offers["priceCurrency"] = getNonEmptyString(
          productData.currency,
          "TND",
        );

        const structured: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: productData.name,
          description: productData.description,
          brand: {
            "@type": "Brand",
            name: getNonEmptyString(productData.brand, this.siteName),
          },
          offers,
          sku: productData.sku,
          category: productData.category,
        };

        if (imageUrls && imageUrls.length > 0) {
          structured["image"] = imageUrls;
        }

        if (
          productData.rating &&
          typeof productData.rating.average === "number" &&
          typeof productData.rating.count === "number"
        ) {
          structured["aggregateRating"] = {
            "@type": "AggregateRating",
            ratingValue: productData.rating.average,
            reviewCount: productData.rating.count,
          };
        }

        return structured;
      }

      case "organization": {
        const organizationData = data as OrganizationStructuredDataInput;
        const sameAsLinks =
          Array.isArray(organizationData.sameAs) &&
          organizationData.sameAs.length > 0
            ? organizationData.sameAs.filter(
                (url) => typeof url === "string" && url.trim().length > 0,
              )
            : undefined;

        const organization: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: this.siteName,
          url: getNonEmptyString(organizationData.url, this.baseUrl),
          logo: getNonEmptyString(
            organizationData.logo,
            `${this.baseUrl}/images/logo.png`,
          ),
        };

        if (sameAsLinks && sameAsLinks.length > 0) {
          organization["sameAs"] = sameAsLinks;
        }

        return organization;
      }

      case "breadcrumb": {
        const breadcrumbData = data as BreadcrumbStructuredDataInput;
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbData.items.map((item, index) => {
            const itemUrl = item.url.startsWith("http")
              ? item.url
              : `${this.baseUrl}${item.url}`;
            return {
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: itemUrl,
            };
          }),
        };
      }

      default:
        return null;
    }
  }

  static generateSitemap(
    pages: Array<{ url: string; lastModified?: Date; priority?: number }>,
  ) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `
  <url>
    <loc>${this.baseUrl}${page.url}</loc>
    <lastmod>${(page.lastModified ?? new Date()).toISOString()}</lastmod>
    <priority>${page.priority ?? 0.5}</priority>
  </url>
`,
  )
  .join("")}
</urlset>`;
    return sitemap;
  }

  static generateRobotsTxt(disallow: string[] = []) {
    return `User-agent: *
${disallow.map((path) => `Disallow: ${path}`).join("\n")}
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml`;
  }
}

// Accessibility utilities
export class AccessibilityManager {
  // ARIA live region announcer
  static announce(
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) {
    if (typeof window === "undefined") return;

    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  // Focus management
  static trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener("keydown", handleTabKey);
    };
  }

  // Skip link implementation
  static createSkipLink(targetId: string, text = "Skip to main content") {
    if (typeof window === "undefined") return;

    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = "skip-link";
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Color contrast checker
  static checkContrast(
    foreground: string | undefined,
    background: string | undefined,
  ): number {
    const getLuminance = (color: string | undefined): number => {
      if (typeof color !== "string") return 0;

      // Remove the '#' if present
      const hex = color.startsWith("#") ? color.slice(1) : color;

      // Parse the hex color into RGB components
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      // Convert to sRGB
      const sRGB = [r, g, b].map((c) => {
        if (isNaN(c)) return 0; // Default to 0 if parsing fails
        if (c <= 0.03928) return c / 12.92;
        return Math.pow((c + 0.055) / 1.055, 2.4);
      }) as [number, number, number];

      // Calculate relative luminance
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    try {
      const lum1 = getLuminance(foreground);
      const lum2 = getLuminance(background);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);

      return (brightest + 0.05) / (darkest + 0.05);
    } catch (error) {
      console.error("Error calculating contrast ratio:", error);
      return 1; // Minimum contrast ratio
    }
  }

  // Keyboard navigation helpers
  static handleArrowNavigation(
    elements: NodeListOf<HTMLElement> | undefined,
    currentIndex: number,
    direction: "horizontal" | "vertical",
  ): (e: KeyboardEvent) => number {
    return (e: KeyboardEvent): number => {
      if (!elements || elements.length === 0) return currentIndex;

      let newIndex = currentIndex;
      const key = e.key;

      if (direction === "horizontal") {
        if (key === "ArrowLeft") {
          newIndex = Math.max(0, currentIndex - 1);
        } else if (key === "ArrowRight") {
          newIndex = Math.min(elements.length - 1, currentIndex + 1);
        }
      } else {
        if (key === "ArrowUp") {
          newIndex = Math.max(0, currentIndex - 1);
        } else if (key === "ArrowDown") {
          newIndex = Math.min(elements.length - 1, currentIndex + 1);
        }
      }

      const targetElement = elements?.[newIndex];
      if (newIndex !== currentIndex && targetElement) {
        try {
          targetElement.focus();
          return newIndex;
        } catch (error) {
          console.error("Error focusing element:", error);
        }
      }

      return currentIndex;
    };
  }
}

// Performance and accessibility hooks
export const useSEO = (config: SEOConfig) => {
  return SEOManager.generateMetadata(config);
};

export const useAccessibility = () => {
  return {
    announce: (message: string, mode: "polite" | "assertive" = "polite") => {
      if (typeof document === "undefined") return;

      const container = document.createElement("div");
      container.setAttribute("aria-live", mode);
      container.style.position = "absolute";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.padding = "0";
      container.style.margin = "-1px";
      container.style.overflow = "hidden";
      container.style.clip = "rect(0, 0, 0, 0)";
      container.style.whiteSpace = "nowrap";
      container.style.border = "0";

      container.textContent = message;
      document.body.appendChild(container);

      // Remove after a short delay
      setTimeout(() => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 1000);
    },

    trapFocus: (element: HTMLElement | null) => {
      if (!element) return () => {};

      // Get all focusable elements
      const focusableElements = Array.from(
        element.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        return (
          !el.hasAttribute("disabled") &&
          !el.getAttribute("aria-hidden") &&
          el.offsetParent !== null
        );
      });

      // Return early if no focusable elements found
      if (focusableElements.length === 0) return () => {};

      // Get first and last focusable elements
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Validate elements exist
      if (!firstElement || !lastElement) return () => {};

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        const activeElement = document.activeElement;
        if (!activeElement) return;

        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      // Add event listener
      document.addEventListener("keydown", handleKeyDown);

      // Focus the first element if it exists
      try {
        firstElement.focus();
      } catch (error) {
        console.error("Error focusing element:", error);
      }

      // Return cleanup function
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
  };
};

// Validation utilities
type ValidationResult = {
  valid: boolean;
  message: string | null;
};

type RGB = [number, number, number];

type AccessibilityValidator = {
  hasProperLabeling: (element: HTMLElement | null) => ValidationResult;
  hasSufficientContrast: (
    foreground: string,
    background: string,
  ) => ValidationResult;
  isKeyboardAccessible: (element: HTMLElement | null) => ValidationResult;
  validateForm: (form: HTMLFormElement | null) => ValidationResult;
};

// Helper function to parse hex color to RGB
const hexToRgb = (hex: string): RGB => {
  // Remove '#' if present
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;

  // Handle shorthand hex notation (e.g., #abc -> #aabbcc)
  const fullHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((c) => c + c)
          .join("")
      : normalizedHex;

  if (fullHex.length !== 6) {
    throw new Error("Invalid hex color length");
  }

  // Parse hex to RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error("Invalid hex color values");
  }

  return [r, g, b];
};

// Helper function to calculate relative luminance (WCAG 2.0)
const calculateLuminance = (r: number, g: number, b: number): number => {
  // Convert RGB values to relative luminance
  const rLum =
    r / 255 <= 0.03928
      ? r / 255 / 12.92
      : Math.pow((r / 255 + 0.055) / 1.055, 2.4);

  const gLum =
    g / 255 <= 0.03928
      ? g / 255 / 12.92
      : Math.pow((g / 255 + 0.055) / 1.055, 2.4);

  const bLum =
    b / 255 <= 0.03928
      ? b / 255 / 12.92
      : Math.pow((b / 255 + 0.055) / 1.055, 2.4);

  // Calculate relative luminance using WCAG 2.0 formula
  return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
};

// Export the accessibility validator with all the validation methods
export const validateAccessibility: AccessibilityValidator = {
  // Check if element has proper ARIA labels and attributes
  hasProperLabeling(element: HTMLElement | null): ValidationResult {
    if (!element) {
      return { valid: false, message: "Element is null or undefined" };
    }

    const errors: string[] = [];
    const tagName = element.tagName.toLowerCase();
    const elementId = getNonEmptyString(element.id, "unnamed");
    const hasAriaLabel = element.hasAttribute("aria-label");
    const hasAriaLabelledBy = element.hasAttribute("aria-labelledby");
    const hasTitle = element.hasAttribute("title");
    const hasTextContent = (element.textContent?.trim().length ?? 0) > 0;

    // Skip hidden elements from accessibility tree
    if (element.getAttribute("aria-hidden") === "true") {
      return { valid: true, message: null };
    }

    // Check for images without alt text
    if (tagName === "img" && !element.hasAttribute("alt") && !hasAriaLabel) {
      errors.push(`Image ${elementId} is missing alt text or aria-label`);
    }

    // Check for form controls without proper labeling
    if (["input", "select", "textarea"].includes(tagName)) {
      const inputElement = element as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      const hasLabel = inputElement.labels && inputElement.labels.length > 0;

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        errors.push(
          `Form control ${elementId} is missing a label or accessible name`,
        );
      }
    }

    // Check for custom interactive elements without proper roles
    const role = element.getAttribute("role");
    const isInteractive =
      role === "button" || role === "link" || "onclick" in element;

    if (
      isInteractive &&
      !hasAriaLabel &&
      !hasAriaLabelledBy &&
      !hasTitle &&
      !hasTextContent
    ) {
      errors.push(
        `Interactive element ${elementId} is missing an accessible name`,
      );
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join("; ") : null,
    };
  },

  // Check if interactive elements are keyboard accessible
  isKeyboardAccessible(element: HTMLElement | null): ValidationResult {
    if (!element) {
      return { valid: false, message: "Element is null or undefined" };
    }

    const tabIndex = element.getAttribute("tabindex");
    const tagName = element.tagName.toLowerCase();

    // Check if element is natively focusable
    const isNativelyFocusable = [
      "button",
      "input",
      "select",
      "textarea",
      "a",
      "area",
      "iframe",
      "object",
      "embed",
      "summary",
    ].includes(tagName);

    // Check for other focusable elements
    const isFocusable =
      element.tabIndex >= 0 ||
      (element as HTMLAnchorElement).href !== undefined ||
      (element as HTMLButtonElement).type === "button" ||
      (element as HTMLInputElement).type === "button" ||
      (element as HTMLSelectElement).type === "select-one" ||
      (element as HTMLTextAreaElement).type === "textarea";

    const isValid =
      isNativelyFocusable ||
      isFocusable ||
      (tabIndex !== null && tabIndex !== "-1");

    return {
      valid: isValid,
      message: isValid
        ? null
        : `Element <${tagName}> is not keyboard accessible`,
    };
  },

  // Check color contrast between foreground and background colors
  hasSufficientContrast(
    foreground: string,
    background: string,
  ): ValidationResult {
    try {
      // Get RGB values for both colors
      const [r1, g1, b1] = hexToRgb(foreground);
      const [r2, g2, b2] = hexToRgb(background);

      // Calculate relative luminance for both colors
      const lum1 = calculateLuminance(r1, g1, b1);
      const lum2 = calculateLuminance(r2, g2, b2);

      // Calculate contrast ratio
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      const ratio = (brightest + 0.05) / (darkest + 0.05);

      // WCAG AA standard for normal text (4.5:1)
      const isValid = ratio >= 4.5;

      return {
        valid: isValid,
        message: isValid
          ? null
          : `Insufficient color contrast ratio: ${ratio.toFixed(2)} (minimum required: 4.5)`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error in hasSufficientContrast:", errorMessage);
      return {
        valid: false,
        message: `Error checking contrast: ${errorMessage}`,
      };
    }
  },

  // Validate form accessibility
  validateForm(form: HTMLFormElement | null): ValidationResult {
    if (!form) {
      return {
        valid: false,
        message: "Form is null or undefined",
      };
    }

    const errors: string[] = [];
    const formElements = form.elements;

    // Check form elements
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i] as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;

      // Skip hidden and disabled elements
      if (element.getAttribute("type") === "hidden" || element.disabled) {
        continue;
      }

      // Check for proper labeling
      if (!element.labels || element.labels.length === 0) {
        if (
          !element.hasAttribute("aria-label") &&
          !element.hasAttribute("aria-labelledby")
        ) {
          const elementType = element.tagName.toLowerCase();
          const fallbackId = getNonEmptyString(element.id, "unnamed");
          const fieldName = getNonEmptyString(
            element.getAttribute("name"),
            getNonEmptyString(element.name, fallbackId),
          );
          errors.push(`${elementType} "${fieldName}" is missing a label`);
        }
      }

      // Check required fields
      if (element.required && !element.hasAttribute("aria-required")) {
        const fallbackId = getNonEmptyString(element.id, "unnamed");
        const fieldName = getNonEmptyString(element.name, fallbackId);
        errors.push(`Required field "${fieldName}" is missing aria-required`);
      }

      // Check for error messages on invalid fields
      if ("validity" in element && !element.validity.valid) {
        const errorId = `${element.id}-error`;
        const errorMessage = document.getElementById(errorId);

        const fallbackId = getNonEmptyString(element.id, "unnamed");
        const fieldName = getNonEmptyString(element.name, fallbackId);
        if (!errorMessage) {
          errors.push(`Missing error message for invalid field: ${fieldName}`);
        } else if (
          !element.hasAttribute("aria-describedby") ||
          !element.getAttribute("aria-describedby")?.includes(errorId)
        ) {
          errors.push(
            `Field "${fieldName}" is not associated with its error message`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join("; ") : null,
    };
  },
}; // Closing brace for validateAccessibility object

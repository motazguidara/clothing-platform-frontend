// SEO and accessibility utilities

import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
}

export class SEOManager {
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clothing-platform.com';
  private static siteName = 'Clothing Platform';
  private static defaultImage = '/images/og-default.jpg';

  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      canonical,
      ogImage,
      ogType = 'website',
      price,
      currency = 'USD',
      availability,
      brand,
      category,
      sku,
    } = config;

    const fullTitle = `${title} | ${this.siteName}`;
    const url = canonical ? `${this.baseUrl}${canonical}` : this.baseUrl;
    const image = ogImage ? `${this.baseUrl}${ogImage}` : `${this.baseUrl}${this.defaultImage}`;

    const metadata: Metadata = {
      title: fullTitle,
      description,
      keywords: keywords.join(', '),
      canonical: url,
      
      // Open Graph
      openGraph: {
        title: fullTitle,
        description,
        url,
        siteName: this.siteName,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: ogType,
      },

      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: [image],
        creator: '@clothingplatform',
      },

      // Additional meta tags
      other: {
        'theme-color': '#000000',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'format-detection': 'telephone=no',
      },
    };

    // Product-specific metadata
    if (ogType === 'product' && price) {
      metadata.other = {
        ...metadata.other,
        'product:price:amount': price.toString(),
        'product:price:currency': currency,
        'product:availability': availability || 'in_stock',
        'product:brand': brand || this.siteName,
        'product:category': category || '',
        'product:retailer_item_id': sku || '',
      };
    }

    return metadata;
  }

  static generateStructuredData(type: 'product' | 'organization' | 'breadcrumb', data: any) {
    switch (type) {
      case 'product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          description: data.description,
          image: data.images?.map((img: string) => `${this.baseUrl}${img}`),
          brand: {
            '@type': 'Brand',
            name: data.brand || this.siteName,
          },
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency || 'USD',
            availability: `https://schema.org/${data.availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
            seller: {
              '@type': 'Organization',
              name: this.siteName,
            },
          },
          aggregateRating: data.rating ? {
            '@type': 'AggregateRating',
            ratingValue: data.rating.average,
            reviewCount: data.rating.count,
          } : undefined,
          sku: data.sku,
          category: data.category,
        };

      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: this.siteName,
          url: this.baseUrl,
          logo: `${this.baseUrl}/images/logo.png`,
          sameAs: [
            'https://facebook.com/clothingplatform',
            'https://twitter.com/clothingplatform',
            'https://instagram.com/clothingplatform',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-123-4567',
            contactType: 'customer service',
          },
        };

      case 'breadcrumb':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${this.baseUrl}${item.url}`,
          })),
        };

      default:
        return null;
    }
  }

  static generateSitemap(pages: Array<{ url: string; lastModified?: Date; priority?: number }>) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>${this.baseUrl}${page.url}</loc>
    <lastmod>${(page.lastModified || new Date()).toISOString()}</lastmod>
    <priority>${page.priority || 0.5}</priority>
  </url>
`).join('')}
</urlset>`;
    return sitemap;
  }

  static generateRobotsTxt(disallow: string[] = []) {
    return `User-agent: *
${disallow.map(path => `Disallow: ${path}`).join('\n')}
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml`;
  }
}

// Accessibility utilities
export class AccessibilityManager {
  // ARIA live region announcer
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (typeof window === 'undefined') return;

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  // Focus management
  static trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
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

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }

  // Skip link implementation
  static createSkipLink(targetId: string, text = 'Skip to main content') {
    if (typeof window === 'undefined') return;

    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
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

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Color contrast checker
  static checkContrast(foreground: string, background: string): number {
    const getLuminance = (color: string) => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(c => {
        const sRGB = parseInt(c) / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Keyboard navigation helpers
  static handleArrowNavigation(
    elements: NodeListOf<HTMLElement>,
    currentIndex: number,
    direction: 'horizontal' | 'vertical'
  ) {
    return (e: KeyboardEvent) => {
      let newIndex = currentIndex;

      if (direction === 'horizontal') {
        if (e.key === 'ArrowLeft') newIndex = Math.max(0, currentIndex - 1);
        if (e.key === 'ArrowRight') newIndex = Math.min(elements.length - 1, currentIndex + 1);
      } else {
        if (e.key === 'ArrowUp') newIndex = Math.max(0, currentIndex - 1);
        if (e.key === 'ArrowDown') newIndex = Math.min(elements.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        elements[newIndex].focus();
        e.preventDefault();
      }
    };
  }
}

// Performance and accessibility hooks
export const useSEO = (config: SEOConfig) => {
  return SEOManager.generateMetadata(config);
};

export const useAccessibility = () => {
  const announce = AccessibilityManager.announce;
  const trapFocus = AccessibilityManager.trapFocus;
  
  return { announce, trapFocus };
};

// Validation utilities
export const validateAccessibility = {
  // Check if element has proper ARIA labels
  hasProperLabeling(element: HTMLElement): boolean {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasTitle = element.hasAttribute('title');
    const hasTextContent = element.textContent?.trim().length > 0;

    return hasAriaLabel || hasAriaLabelledBy || hasTitle || hasTextContent;
  },

  // Check if interactive elements are keyboard accessible
  isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    const isNativelyFocusable = ['button', 'input', 'select', 'textarea', 'a'].includes(
      element.tagName.toLowerCase()
    );

    return isNativelyFocusable || (tabIndex !== null && tabIndex !== '-1');
  },

  // Validate form accessibility
  validateForm(form: HTMLFormElement): string[] {
    const errors: string[] = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.hasAttribute('aria-label')) {
        errors.push(`Input ${input.id || 'unnamed'} lacks proper labeling`);
      }

      if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
        errors.push(`Required input ${input.id || 'unnamed'} should have aria-required`);
      }
    });

    return errors;
  },
};

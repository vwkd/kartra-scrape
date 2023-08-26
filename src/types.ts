/**
 * Sitemap
 *
 * tree of sections and pages
 *
 * - beware: arbitrary depth, should be restricted to amount of headers (6)!
 * - beware: unequal depth possible, should be same depth everywhere!
 */
export type Sitemap = (Section | Page)[];

/**
 * Section
 *
 * internal node in sitemap tree
 */
export interface Section {
  name: string;
  children: Sitemap;
}

/**
 * Page
 *
 * leaf node in sitemap tree
 */
export interface Page {
  name: string;
  url: string;
}

/**
 * Type guard for TypeScript
 *
 * @param value section or page
 * @returns true if section, false if page
 */
export function isSection(value: Section | Page): value is Section {
  return value.hasOwnProperty("children");
}

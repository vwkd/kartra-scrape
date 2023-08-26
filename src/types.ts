/**
 * Sitemap tree of sections and pages
 *
 * - beware: arbitrary depth, should be restricted to amount of headers (6)!
 * - beware: unequal depth possible, should be same depth everywhere!
 */
export type Sitemap = (Section | Page)[];

export interface Section {
  name: string;
  children: Sitemap;
}

export interface Page {
  name: string;
  url: string;
}

export function isSection(value: Section | Page): value is Section {
  return value.hasOwnProperty("children");
}

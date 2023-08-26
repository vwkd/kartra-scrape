import "$std/dotenv/load.ts";

import { makeRequest } from "./api.ts";
import { parsePage, parseSitemap } from "./parse.ts";
import { Sitemap } from "./types.ts";

const INDEX_PATH = "index";
const SITEMAP_PATH = "0";

/**
 * Get index page
 *
 * @returns markdown of index page
 */
async function getIndex(): Promise<string> {
  const index = await makeRequest(INDEX_PATH);

  const page = await parsePage(index);

  return page;
}

/**
 * Get sitemap
 *
 * @returns sitemap object
 */
async function getSitemap(): Promise<Sitemap> {
  const sitemap_html = await makeRequest(SITEMAP_PATH);

  const sitemap = parseSitemap(sitemap_html);

  return sitemap;
}

if (import.meta.main) {
  const md = await getIndex();

  // todo:
}
